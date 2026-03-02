import { base64url } from 'jose';
import {
    createPresentationInternalRepresentation,
    signPayloadSHA256,
    writeBinary,
    writeUtf8,
} from './utils.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";
import * as cbor from "cbor2";
import * as cborEdn from "cbor-edn";
import {registerEncoder} from "cbor2/encoder";

import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with {type: "json"};
import ephemeralPrivateKeyJSON from "./build/es256-ephemeral-private-key.jwk.json" with {type: "json"};
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with {type: "json"};

const { encode, decode } = base64url;

function uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
}
  
function base64urlToHex(base64url) {
    return uint8ArrayToHex(decode(base64url));
}
registerEncoder(Buffer, b => [
    // Don't write a tag
    NaN,
    // New view on the ArrayBuffer, without copying bytes
    new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
  ]);

function cborFromString(cborEdnStr, filename) {
    return cbor.decode(cborBinaryFromString(cborEdnStr, filename),
    {
        rejectBigInts: true,
        rejectDuplicateKeys: true,
        rejectFloats: true,
        rejectLargeNegatives: true,
        rejectSimple: true,
        rejectStreaming: true,
        rejectUndefined: true            
    });
}

function cborBinaryFromString(cborEdnStr, filename) {
    return cborEdn.parseEDN(cborEdnStr,
        { grammarSource: filename,
            validateUTF8: true
        });
}

async function cborBinaryFromFile(filename) {
    return cborBinaryFromString(await fs.readFile(filename, {encoding: "utf-8"}), filename);
}

async function cborFromFile(filename) {
    return cborFromString(await fs.readFile(filename, {encoding: "utf-8"}), filename);
}

const presentationNonce = decode(presentationNonceStr);

// pull private key JSON from disk, create corresponding KeyObjects,
// and create CWK versions of the public keys
const issuerPrivateKey = crypto.createPrivateKey({
    key: issuerPrivateKeyJSON, 
    format: "jwk"
});
const holderPrivateKey = crypto.createPrivateKey({
    key: holderPrivateKeyJSON,
    format: "jwk"
});
const ephemeralPrivateKey = crypto.createPrivateKey({
    key: ephemeralPrivateKeyJSON, 
    format: "jwk"
});

// update EDN with key text
var issuerHeaderText = 
    (await fs.readFile("./template/cpt-issuer-header.edn", {encoding: "utf-8"})).
        replace("/ iek-x /", "-2: h'" + base64urlToHex(ephemeralPrivateKeyJSON.x).match(/.{1,56}/g).join("' +\n        h'") + "', / x /").
        replace("/ iek-y /", "-3: h'" + base64urlToHex(ephemeralPrivateKeyJSON.y).match(/.{1,56}/g).join("' +\n        h'") + "'  / y /").
        replace("/ hpk-x /", "-2: h'" + base64urlToHex(holderPrivateKeyJSON.x).match(/.{1,56}/g).join("' +\n        h'") + "', / x /").
        replace("/ hpk-y /", "-3: h'" + base64urlToHex(holderPrivateKeyJSON.y).match(/.{1,56}/g).join("' +\n        h'") + "'  / y /");
await writeUtf8("./build/cpt-issuer-header.edn", issuerHeaderText);

const issuerHeaderOctets = await cborBinaryFromFile("./build/cpt-issuer-header.edn");
const issuerPayloads = await cborFromFile("./template/cpt-issuer-payloads.edn");

// // update issuerHeader with fresh CWKs
// issuerHeader.set(9, holderPublicKey);
// issuerHeader.set(8, ephemeralPublicKey);

// create an array of the CBOR octet payloads
const payloadOctets = issuerPayloads.map((item) => cbor.encode(item));

// import holderHeaderJSON from "./template/su-es256-holder-header.json" with {type: "json"};

// storage as we build up
const sigs = [];

// encode/sign the issuer header with the stable key
sigs.push(await signPayloadSHA256(issuerHeaderOctets, issuerPrivateKey));

// sign each payload with the ephemeral key
for (let payload of payloadOctets) {
    const signature = await signPayloadSHA256(payload, ephemeralPrivateKey);
    sigs.push(signature);
};

let issuedFormCborSerialization = cbor.encode([
    issuerHeaderOctets,
    issuerPayloads,
    sigs
]);

// merge final signature
await writeBinary("./build/cpt-issuer-form.cbor", issuedFormCborSerialization);

// hex encode and create a 64 character width block
let hex = uint8ArrayToHex(issuedFormCborSerialization);
let wrapped = [...hex.matchAll(/.{1,64}/g)].flatMap((m) => m).join("\n");

await writeUtf8("./build/cpt-issuer-form.cbor.hex", wrapped);

// modify the EDN for the holder header to include the generated nonce
var holderHeaderText = 
    (await fs.readFile("./template/cpt-holder-header.edn", {encoding: "utf-8"})).
        replace("/ nonce /", "7: h'" + uint8ArrayToHex(presentationNonce) + "', / nonce /");
await writeUtf8("./build/cpt-holder-header.edn", holderHeaderText);

// load in 
var holderHeaderOctets = await cborBinaryFromFile("./build/cpt-holder-header.edn");

issuerPayloads[7] = null;
issuerPayloads[8] = null;

let internalRepresentation = createPresentationInternalRepresentation(issuerHeaderOctets, holderHeaderOctets, issuerPayloads, sigs );

let signature = await signPayloadSHA256(internalRepresentation, holderPrivateKey);
await writeUtf8("build/cpt-presentation-pop.base64url", encode(signature));
await fs.rm("build/cpt-presentation-pop.base64url.wrapped", { force: true });

sigs.splice(6, 2); // remove last two 
sigs.push(signature);

let presentedFormCborSerialization = cbor.encode([
    holderHeaderOctets,
    issuerHeaderOctets,
    issuerPayloads,
    sigs
]);

await writeBinary("./build/cpt-presentation-form.cbor", presentedFormCborSerialization);
// hex encode and create a 64 character width block
hex = uint8ArrayToHex(presentedFormCborSerialization);
wrapped = [...hex.matchAll(/.{1,64}/g)].flatMap((m) => m).join("\n");
await writeUtf8("./build/cpt-presentation-form.cbor.hex", wrapped);

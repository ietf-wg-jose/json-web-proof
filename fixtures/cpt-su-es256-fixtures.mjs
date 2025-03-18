import { base64url } from 'jose';
import { lineWrap, compactPayloadEncode, jsonPayloadEncode, signPayloadSHA256 } from './utils.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";
import * as cbor from "cbor2";
import * as cborEdn from "cbor-edn";
import {registerEncoder} from "cbor2/encoder";

import issuerPrivateKeyJSON from "./build/issuer-private-key-es256.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/holder-private-key-es256.jwk.json" with {type: "json"};
import ephemeralPrivateKeyJSON from "./build/ephemeral-private-key-es256.jwk.json" with {type: "json"};
import issuerNonceStr from "./build/issuer-nonce.json" with {type: "json"};
import presentationNonceStr from "./build/presentation-nonce.json" with {type: "json"};

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
    return cbor.decode(
        cborEdn.parseEDN(cborEdnStr,
            { grammarSource: filename,
                validateUTF8: true
            }),
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

async function cborFromFile(filename) {
    return cborFromString(await fs.readFile(filename, {encoding: "utf-8"}), filename);
}

const issuerNonce = decode(issuerNonceStr);
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

function cwkFromP256Jwk(jwk) {
    return new Map([
        [ 1, 2 ],  // kty : "EC2" /
        [-1, 1 ],  // crv: "P-256" /
        [-2, decode(jwk.x)],
        [-3, decode(jwk.y)]
        ]);
}

const issuerPublicKey = cwkFromP256Jwk(issuerPrivateKeyJSON);
const holderPublicKey = cwkFromP256Jwk(holderPrivateKeyJSON);
const ephemeralPublicKey = cwkFromP256Jwk(ephemeralPrivateKeyJSON);

// update EDN with key text
var issuerProtectedHeaderText = 
    (await fs.readFile("./template/cpt-issuer-protected-header.edn", {encoding: "utf-8"})).
        replace("/ proof-x /", "-2: h'" + base64urlToHex(holderPrivateKeyJSON.x) + "', / x /").
        replace("/ proof-y /", "-3: h'" + base64urlToHex(holderPrivateKeyJSON.y) + "'  / y /").
        replace("/ ephemeral-x /", "-2: h'" + base64urlToHex(ephemeralPrivateKeyJSON.x) + "', / x /").
        replace("/ ephemeral-y /", "-3: h'" + base64urlToHex(ephemeralPrivateKeyJSON.y) + "'  / y /");
await fs.writeFile("./build/cpt-issuer-protected-header.edn", issuerProtectedHeaderText, {encoding: "utf-8"});

const issuerProtectedHeader = await cborFromFile("./build/cpt-issuer-protected-header.edn");
const issuerPayloads = await cborFromFile("./template/cpt-issuer-payloads.edn");

// // update issuerProtectedHeader with fresh CWKs
// issuerProtectedHeader.set(9, holderPublicKey);
// issuerProtectedHeader.set(8, ephemeralPublicKey);

// create an array of the CBOR octet payloads
const payloadOctets = issuerPayloads.map((item) => cbor.encode(item));

// import holderProtectedHeaderJSON from "./template/su-es256-holder-protected-header.json" with {type: "json"};

// storage as we build up
const sigs = [];

// encode/sign the issuer protected header w/ the stable key
const issuerProtectedHeaderOctets = cbor.encode(issuerProtectedHeader);
sigs.push(await signPayloadSHA256(issuerProtectedHeaderOctets, issuerPrivateKey));

// sign each payload with the ephemeral key
for (let payload of payloadOctets) {
    const signature = await signPayloadSHA256(payload, ephemeralPrivateKey);
    sigs.push(signature);
};

let cborSerialization = cbor.encode([
    issuerProtectedHeaderOctets,
    issuerPayloads,
    sigs
]);

// merge final signature
await fs.writeFile("./build/cpt-issuer-proof.cbor", cborSerialization);

// hex encode and create a 64 character width block
let hex = uint8ArrayToHex(cborSerialization);
let wrapped = [...hex.matchAll(/.{1,64}/g)].flatMap((m) => m).join("\n");

await fs.writeFile("./build/cpt-issued-form.cbor.hex", wrapped, {encoding: "UTF-8"});
// // Compact Serialization
// let compactSerialization = [
//     encode(issuerProtectedHeader),
//     payloads.map(compactPayloadEncode).join("~"),
//     sigs.map(encode).join("~")
// ].join(".");

// await fs.writeFile("build/su-es256-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});
// await fs.writeFile("build/su-es256-issuer.compact.jwp.wrapped", lineWrap(compactSerialization));

// // JSON Serialization
// let jsonSerialization = {
//     issuer: encode(issuerProtectedHeader),
//     payloads: payloads.map(jsonPayloadEncode),
//     proof: sigs.map(encode)
// };

// let jsonSerializationStr = JSON.stringify(jsonSerialization, null, 2);
// await fs.writeFile("build/su-es256-issuer.json.jwp", jsonSerializationStr);
// await fs.writeFile("build/su-es256-issuer.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

// holderProtectedHeaderJSON.nonce = presentationNonceStr;
// let holderProtectedHeader = Buffer.from(JSON.stringify(holderProtectedHeaderJSON), "UTF-8");
// await fs.writeFile("build/su-es256-presentation-protected-header.json", JSON.stringify(holderProtectedHeaderJSON, null, 2), {encoding: "UTF-8"});
// await fs.writeFile("build/su-es256-presentation-protected-header.json.wrapped", lineWrap(JSON.stringify(holderProtectedHeaderJSON, null, 2)), {encoding: "UTF-8"});

// await fs.writeFile("build/su-es256-holder-protected-header.b64.wrapped", lineWrap(encode(holderProtectedHeader)), "UTF-8");

// let signature = await signPayloadSHA256(holderProtectedHeader, holderPrivateKey);
// await fs.writeFile("build/su-es256-holder-pop.b64.wrapped", lineWrap(encode(signature)), "UTF-8");

// sigs.splice(1, 0, signature);
// sigs.splice(7, 2); // remove last two 
// payloads[7] = null;
// payloads[8 ] = null;
// await fs.writeFile("build/su-es256-presentation-proof.json.wrapped", lineWrap(JSON.stringify(sigs.map(encode), 0, 2)), {encoding: "UTF-8"});

// // Compact Serialization
// compactSerialization = [
//     encode(holderProtectedHeader),
//     encode(issuerProtectedHeader),
//     payloads.map(compactPayloadEncode).join("~"),
//     sigs.map(encode).join("~")
// ].join(".");
// await fs.writeFile("build/su-es256-presentation.compact.jwp", compactSerialization, {encoding: "UTF-8"});
// await fs.writeFile("build/su-es256-presentation.compact.jwp.wrapped", lineWrap(compactSerialization));

// // JSON Serialization
// jsonSerialization = {
//     presentation: encode(holderProtectedHeader),
//     issuer: encode(issuerProtectedHeader),
//     payloads: payloads.map(jsonPayloadEncode),
//     proof: sigs.map(encode)
// };

// jsonSerializationStr = JSON.stringify(jsonSerialization, null, 2);
// await fs.writeFile("build/su-es256-presentation.json.jwp", jsonSerializationStr);
// await fs.writeFile("build/su-es256-presentation.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

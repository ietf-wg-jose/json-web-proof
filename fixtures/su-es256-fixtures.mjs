import { base64url } from 'jose';
import { GeneralSign } from 'jose';
import { lineWrap } from './linewrap.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";

import payloadsJSON from "./template/jpt-issuer-payloads.json" assert {type: "json"};
import issuerPrivateKeyJSON from "./build/issuer-private-key-es256.jwk.json" assert {type: "json"};
import holderPrivateKeyJSON from "./build/holder-private-key-es256.jwk.json" assert {type: "json"};
import ephemeralPrivateKeyJSON from "./build/ephemeral-private-key-es256.jwk.json" assert {type: "json"};
import issuerNonceStr from "./build/issuer-nonce.json" assert {type: "json"};
import presentationNonceStr from "./build/presentation-nonce.json" assert {type: "json"};
import issuerProtectedHeaderJSON from "./template/su-es256-issuer-protected-header.json" assert {type: "json"};
import holderProtectedHeaderJSON from "./template/su-es256-holder-protected-header.json" assert {type: "json"};

const { encode, decode } = base64url;

const payloads = payloadsJSON.map((item) => Buffer.from(JSON.stringify(item), "UTF-8"));
const issuerNonce = decode(issuerNonceStr);
const presentationNonce = decode(presentationNonceStr);

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

// use jose wrapper
async function sign_payload(payload, key){
    const sig = new GeneralSign(decode(payload));
    sig.addSignature(key).setProtectedHeader({'alg':'ES256'});
    const jws = await sig.sign();
    return jws.signatures[0].signature;
}

// storage as we build up
const sigs = [];

issuerProtectedHeaderJSON.proof_jwk = ephemeralPrivateKeyJSON;
issuerProtectedHeaderJSON.presentation_jwk = holderPrivateKeyJSON;
await fs.writeFile("build/su-es256-issuer-protected-header.json", JSON.stringify(issuerProtectedHeaderJSON, null, 2), {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-issuer-protected-header.json.wrapped", lineWrap(JSON.stringify(issuerProtectedHeaderJSON, null, 2)), {encoding: "UTF-8"});

let issuerProtectedHeader = Buffer.from(JSON.stringify(issuerProtectedHeaderJSON), "UTF-8");
await fs.writeFile("build/su-es256-issuer-protected-header.b64.wrapped", lineWrap(encode(issuerProtectedHeader)), "UTF-8");

// encode/sign the issuer protected header w/ the stable key
sigs.push(await sign_payload(issuerProtectedHeader, issuerPrivateKey));

for (let payload of payloads) {
    const signature = await sign_payload(payload, ephemeralPrivateKey);
    sigs.push(signature);
};

// merge final signature
let final = Buffer.from([]);

for(let sig of sigs)
{
    final = Buffer.concat([final, decode(sig)]);
}
await fs.writeFile("build/su-es256-issuer-proof.base64url", encode(final), {encoding: "UTF-8"});

// Compact Serialization
let compactSerialization = [
    encode(issuerProtectedHeader),
    payloads.map((item)=>encode(item)).join("~"),
    encode(final)
].join(".");

await fs.writeFile("build/su-es256-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-issuer.compact.jwp.wrapped", lineWrap(compactSerialization));

// JSON Serialization
let jsonSerialziation = {
    issuer: encode(issuerProtectedHeader),
    payloads: payloads.map((item)=>encode(item)),
    proof: encode(final)
};

let jsonSerializationStr = JSON.stringify(jsonSerialziation, null, 2);
await fs.writeFile("build/su-es256-issuer.json.jwp", jsonSerializationStr);
await fs.writeFile("build/su-es256-issuer.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

holderProtectedHeaderJSON.nonce = presentationNonceStr;
let holderProtectedHeader = Buffer.from(JSON.stringify(holderProtectedHeaderJSON), "UTF-8");
await fs.writeFile("build/su-es256-presentation-protected-header.json", JSON.stringify(holderProtectedHeaderJSON, null, 2), {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-presentation-protected-header.json.wrapped", lineWrap(JSON.stringify(holderProtectedHeaderJSON, null, 2)), {encoding: "UTF-8"});

await fs.writeFile("build/su-es256-holder-protected-header.b64.wrapped", lineWrap(encode(holderProtectedHeader)), "UTF-8");

let signature = await sign_payload(holderProtectedHeader, holderPrivateKey);
await fs.writeFile("build/su-es256-holder-pop.b64.wrapped", lineWrap(encode(signature)), "UTF-8");

sigs.splice(1, 0, signature);
sigs.splice(7, 2); // remove last two 
payloads[7] = null;
payloads[8 ] = null;
let pres_final = Buffer.from([]);
for(let sig of sigs)
{
    pres_final = Buffer.concat([pres_final, decode(sig)]);
}
let proof = encode(pres_final);
await fs.writeFile("build/su-es256-presentation-proof.base64url", encode(proof), {encoding: "UTF-8"});

// Compact Serialization
compactSerialization = [
    encode(holderProtectedHeader),
    encode(issuerProtectedHeader),
    payloads.map((item)=>item != null ? encode(item) : "").join("~"),
    encode(proof)
].join(".");
await fs.writeFile("build/su-es256-presentation.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-presentation.compact.jwp.wrapped", lineWrap(compactSerialization));

// JSON Serialization
jsonSerialziation = {
    presentation: encode(holderProtectedHeader),
    issuer: encode(issuerProtectedHeader),
    payloads: payloads.map((item)=>item != null ? encode(item) : null),
    proof: encode(proof)
};

jsonSerializationStr = JSON.stringify(jsonSerialziation, null, 2);
await fs.writeFile("build/su-es256-presentation.json.jwp", jsonSerializationStr);
await fs.writeFile("build/su-es256-presentation.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

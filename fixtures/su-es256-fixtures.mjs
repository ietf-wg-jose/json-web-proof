import { base64url } from 'jose';
import { lineWrap, compactPayloadEncode, jsonPayloadEncode, signPayloadSHA256 } from './utils.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";

import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};
import issuerPrivateKeyJSON from "./build/issuer-private-key-es256.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/holder-private-key-es256.jwk.json" with {type: "json"};
import ephemeralPrivateKeyJSON from "./build/ephemeral-private-key-es256.jwk.json" with {type: "json"};
import issuerNonceStr from "./build/issuer-nonce.json" with {type: "json"};
import presentationNonceStr from "./build/presentation-nonce.json" with {type: "json"};
import issuerProtectedHeaderJSON from "./template/su-es256-issuer-protected-header.json" with {type: "json"};
import holderProtectedHeaderJSON from "./template/su-es256-holder-protected-header.json" with {type: "json"};

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

// storage as we build up
const sigs = [];

issuerProtectedHeaderJSON.proof_key = ephemeralPrivateKeyJSON;
issuerProtectedHeaderJSON.presentation_key = holderPrivateKeyJSON;
await fs.writeFile("build/su-es256-issuer-protected-header.json", JSON.stringify(issuerProtectedHeaderJSON, null, 2), {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-issuer-protected-header.json.wrapped", lineWrap(JSON.stringify(issuerProtectedHeaderJSON, null, 2)), {encoding: "UTF-8"});

let issuerProtectedHeader = Buffer.from(JSON.stringify(issuerProtectedHeaderJSON), "UTF-8");
await fs.writeFile("build/su-es256-issuer-protected-header.b64.wrapped", lineWrap(encode(issuerProtectedHeader)), "UTF-8");

// encode/sign the issuer protected header w/ the stable key
sigs.push(await signPayloadSHA256(issuerProtectedHeader, issuerPrivateKey));

for (let payload of payloads) {
    const signature = await signPayloadSHA256(payload, ephemeralPrivateKey);
    sigs.push(signature);
};

// merge final signature
let final = Buffer.from([]);
await fs.writeFile("build/su-es256-issuer-proof.json.wrapped", lineWrap(JSON.stringify(sigs.map(encode), 0, 2)), {encoding: "UTF-8"});

// Compact Serialization
let compactSerialization = [
    encode(issuerProtectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    sigs.map(encode).join("~")
].join(".");

await fs.writeFile("build/su-es256-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-issuer.compact.jwp.wrapped", lineWrap(compactSerialization));

// JSON Serialization
let jsonSerialization = {
    issuer: encode(issuerProtectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: sigs.map(encode)
};

let jsonSerializationStr = JSON.stringify(jsonSerialization, null, 2);
await fs.writeFile("build/su-es256-issuer.json.jwp", jsonSerializationStr);
await fs.writeFile("build/su-es256-issuer.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

holderProtectedHeaderJSON.nonce = presentationNonceStr;
let holderProtectedHeader = Buffer.from(JSON.stringify(holderProtectedHeaderJSON), "UTF-8");
await fs.writeFile("build/su-es256-presentation-protected-header.json", JSON.stringify(holderProtectedHeaderJSON, null, 2), {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-presentation-protected-header.json.wrapped", lineWrap(JSON.stringify(holderProtectedHeaderJSON, null, 2)), {encoding: "UTF-8"});

await fs.writeFile("build/su-es256-holder-protected-header.b64.wrapped", lineWrap(encode(holderProtectedHeader)), "UTF-8");

let signature = await signPayloadSHA256(holderProtectedHeader, holderPrivateKey);
await fs.writeFile("build/su-es256-holder-pop.b64.wrapped", lineWrap(encode(signature)), "UTF-8");

sigs.splice(1, 0, signature);
sigs.splice(7, 2); // remove last two 
payloads[7] = null;
payloads[8 ] = null;
await fs.writeFile("build/su-es256-presentation-proof.json.wrapped", lineWrap(JSON.stringify(sigs.map(encode), 0, 2)), {encoding: "UTF-8"});

// Compact Serialization
compactSerialization = [
    encode(holderProtectedHeader),
    encode(issuerProtectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    sigs.map(encode).join("~")
].join(".");
await fs.writeFile("build/su-es256-presentation.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/su-es256-presentation.compact.jwp.wrapped", lineWrap(compactSerialization));

// JSON Serialization
jsonSerialization = {
    presentation: encode(holderProtectedHeader),
    issuer: encode(issuerProtectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: sigs.map(encode)
};

jsonSerializationStr = JSON.stringify(jsonSerialization, null, 2);
await fs.writeFile("build/su-es256-presentation.json.jwp", jsonSerializationStr);
await fs.writeFile("build/su-es256-presentation.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

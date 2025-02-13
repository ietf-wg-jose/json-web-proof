import fs from "fs/promises";

import pairing from "@mattrglobal/pairing-crypto";
import { base64url } from 'jose';

import { keyRead } from './bbs-keyread.mjs';
import { lineWrap, compactPayloadEncode, jsonPayloadEncode } from './utils.mjs';

import protectedHeaderJSON from "./template/jpt-issuer-protected-header.json" with {type: "json"};
import presentationHeaderJSON from "./template/bbs-holder-presentation-header.json" with {type: "json"};
import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};

const encode = base64url.encode;

// load/massage data
const keyPair = await keyRead();
const protectedHeader = Buffer.from(JSON.stringify(protectedHeaderJSON), "UTF-8");
const payloads = payloadsJSON.map((item)=>Buffer.from(JSON.stringify(item), "UTF-8"));
const presentationHeader = Buffer.from(JSON.stringify(presentationHeaderJSON), "UTF-8");

// calculate signature
const signature = await pairing.bbs.bls12381_sha256.sign({
    publicKey: keyPair.publicKey.compressed, 
    secretKey: keyPair.secretKey, 
    header: protectedHeader,
    messages: payloads
});

await fs.writeFile("build/bbs-issuer-proof.base64url", encode(signature), {encoding: "UTF-8"});

// Compact Serialization
const compactSerialization = [
    encode(protectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    encode(signature)
].join(".");
await fs.writeFile("build/bbs-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/bbs-issuer.compact.jwp.wrapped", lineWrap(compactSerialization));

// JSON Serialization
const jsonSerialziation = {
    issuer: encode(protectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: [ encode(signature) ]
};

let jsonSerializationStr = JSON.stringify(jsonSerialziation, null, 2);
await fs.writeFile("build/bbs-issuer.json.jwp", jsonSerializationStr);
await fs.writeFile("build/bbs-issuer.json.jwp.wrapped", lineWrap(jsonSerializationStr, 8));

// Generate proof, selectively disclosing only name and age
var proof = await pairing.bbs.bls12381_sha256.deriveProof({
    publicKey: keyPair.publicKey.compressed,
    header: protectedHeader,
    presentationHeader: presentationHeader,
    signature: signature,
    verifySignature: false,
    messages: [
        { value: payloads[0], reveal: true },
        { value: payloads[1], reveal: true },
        { value: payloads[2], reveal: true },
        { value: payloads[3], reveal: true },
        { value: payloads[4], reveal: false },
        { value: payloads[5], reveal: false },
        { value: payloads[6], reveal: false },
    ]
});
await fs.writeFile("build/bbs-holder-proof.base64url", encode(proof), {encoding: "UTF-8"});

// go ahead and modify payloads in place for final output
payloads[4] = null; // remove email
payloads[5] = null; // remove address
payloads[6] = null; // remove age_over_21

// Compact Serialization
const compactHolderSerialization = [
    encode(presentationHeader),
    encode(protectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    encode(proof)
].join(".");
await fs.writeFile("build/bbs-holder.compact.jwp", compactHolderSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/bbs-holder.compact.jwp.wrapped", lineWrap(compactHolderSerialization, 0));

// JSON Serialization
const jsonHolderSerialization = {
    presentation: encode(presentationHeader),
    issuer: encode(protectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: [ encode(proof) ]
};

var jsonHolderSerializationStr = JSON.stringify(jsonHolderSerialization, null, 2);
await fs.writeFile("build/bbs-holder.json.jwp", jsonHolderSerializationStr, {encoding: "UTF-8"});
await fs.writeFile("build/bbs-holder.json.jwp.wrapped", lineWrap(jsonHolderSerializationStr, 8), {encoding: "UTF-8"});

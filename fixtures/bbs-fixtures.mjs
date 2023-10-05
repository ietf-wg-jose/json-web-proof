import fs from "fs/promises";

import pairing from "@mattrglobal/pairing-crypto";
import { encode } from 'jose/util/base64url';

import { keyRead } from './bbs-keyread.mjs';

import protectedHeaderJSON from "./template/bbs-issuer-protected-header.json" assert {type: "json"};
import presentationHeaderJSON from "./template/bbs-prover-presentation-header.json" assert {type: "json"};
import payloadsJSON from "./template/bbs-issuer-payloads.json" assert {type: "json"};

// load/massage data
const keyPair = await keyRead();
const protectedHeader = Buffer.from(JSON.stringify(protectedHeaderJSON), "UTF-8");
const payloads = payloadsJSON.map((item)=>Buffer.from(JSON.stringify(item), "UTF-8"));
const presentationHeader = Buffer.from(JSON.stringify(presentationHeaderJSON), "UTF-8");

// calculate signature
const signature = await pairing.bbs.bls12381_sha256.sign({
    publicKey: keyPair.publicKey, 
    secretKey: keyPair.secretKey, 
    header: protectedHeader,
    payloads: payloads
});

await fs.writeFile("build/bbs-issuer-proof.base64url", encode(signature), {encoding: "UTF-8"});

// Compact Serialization
const compactSerialization = [
    encode(protectedHeader),
    payloads.map((item)=>encode(item)).join("~"),
    encode(signature)
].join(".");
await fs.writeFile("build/bbs-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});

// JSON Serialization
const jsonSerialziation = {
    issuer: encode(protectedHeader),
    payloads: payloads.map((item)=>encode(item)),
    proof: encode(signature)
};

await fs.writeFile("build/bbs-issuer.json.jwp", JSON.stringify(jsonSerialziation, null, 2), {encoding: "UTF-8"});

// Generate proof, selectively disclosing only name and age
var proof = await pairing.bbs.bls12381_sha256.deriveProof({
    publicKey: keyPair.publicKey,
    header: protectedHeader,
    presentationHeader: presentationHeader,
    signature: signature,
    verifySignature: false,
    messages: [
        { value: payloads[0], reveal: true },
        { value: payloads[1], reveal: true },
        { value: payloads[2], reveal: false },
        { value: payloads[3], reveal: true }
    ]
});
await fs.writeFile("build/bbs-prover-proof.base64url", encode(proof), {encoding: "UTF-8"});

// go ahead and modify payloads in place for final output
payloads[2] = null; // remove email

// Compact Serialization
const compactProverSerialization = [
    encode(presentationHeader),
    encode(protectedHeader),
    payloads.map((item)=>encode(item || "")).join("~"),
    encode(proof)
].join(".");
await fs.writeFile("build/bbs-prover.compact.jwp", compactProverSerialization, {encoding: "UTF-8"});

// JSON Serialization
const jsonProverSerialization = {
    presentation: encode(presentationHeader),
    issuer: encode(protectedHeader),
    payloads: payloads.map((item)=> item && encode(item)),
    proof: encode(proof)
};

await fs.writeFile("build/bbs-prover.json.jwp", JSON.stringify(jsonProverSerialization, null, 2), {encoding: "UTF-8"});

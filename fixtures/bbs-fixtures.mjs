import fs from "fs/promises";

import { signSHA256 } from "@alksol/cfrg-bbs";
import { generateProofSha256 } from "@alksol/cfrg-bbs/deterministic";
import { base64url } from 'jose';

import { keyRead } from './bbs-keyread.mjs';
import { lineWrap, compactPayloadEncode } from './utils.mjs';
import { seed32 } from "./deterministic.mjs";

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
const signature = signSHA256(
    keyPair.secretKey,
    keyPair.publicKey.compressed,
    protectedHeader,
    payloads
);

await fs.writeFile("build/bbs-issuer-proof.base64url", encode(signature), {encoding: "UTF-8"});

// Compact Serialization
const compactSerialization = [
    encode(protectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    encode(signature)
].join(".");
await fs.writeFile("build/bbs-issuer.compact.jwp", compactSerialization, {encoding: "UTF-8"});
await fs.writeFile("build/bbs-issuer.compact.jwp.wrapped", lineWrap(compactSerialization));

// Generate proof, selectively disclosing only name and age
const proof = generateProofSha256(
    keyPair.publicKey.compressed,
    signature,
    protectedHeader,
    presentationHeader,
    payloads,
    new Uint32Array([0, 1, 2, 3]),
    seed32("bbs:proof-seed:v1")
);
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

import fs from "fs/promises";

import { signSHA256 } from "@alksol/cfrg-bbs";
import { generateProofSha256 } from "@alksol/cfrg-bbs/deterministic";
import { base64url } from 'jose';

import { keyRead } from './bbs-key-load.mjs';
import {
    compactPayloadEncode,
    serializeJSON,
    writeUtf8,
    writeWrapped
} from './output-writers.mjs';
import { seed32 } from "./deterministic.mjs";

import protectedHeaderJSON from "./template/jpt-issuer-header.json" with {type: "json"};
import holderHeaderJSON from "./template/bbs-holder-header.json" with {type: "json"};
import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};

const encode = base64url.encode;

// load/massage data
const keyPair = await keyRead();
const protectedHeader = Buffer.from(serializeJSON(protectedHeaderJSON), "utf-8");
const payloads = payloadsJSON.map((item) => Buffer.from(serializeJSON(item), "utf-8"));
const holderHeader = Buffer.from(serializeJSON(holderHeaderJSON), "utf-8");

// calculate signature
const signature = signSHA256(
    keyPair.secretKey,
    keyPair.publicKey.compressed,
    protectedHeader,
    payloads
);

await writeUtf8("build/bbs-issuer-proof.base64url", encode(signature));

// Compact Serialization
const compactSerialization = [
    encode(protectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    encode(signature)
].join(".");
await writeUtf8("build/bbs-issuer-compact.jwp", compactSerialization);
await writeWrapped("build/bbs-issuer-compact.jwp.wrapped", compactSerialization);

// Generate proof, selectively disclosing only name and age
const proof = generateProofSha256(
    keyPair.publicKey.compressed,
    signature,
    protectedHeader,
    holderHeader,
    payloads,
    new Uint32Array([0, 1, 2, 3]),
    seed32("bbs:proof-seed:v1")
);
await writeUtf8("build/bbs-presentation-proof.base64url", encode(proof));

// go ahead and modify payloads in place for final output
payloads[4] = null; // remove email
payloads[5] = null; // remove address
payloads[6] = null; // remove age_over_21

// Compact Serialization
const compactHolderSerialization = [
    encode(holderHeader),
    encode(protectedHeader),
    payloads.map(compactPayloadEncode).join("~"),
    encode(proof)
].join(".");
await writeUtf8("build/bbs-presentation-compact.jwp", compactHolderSerialization);
await writeWrapped("build/bbs-presentation-compact.jwp.wrapped", compactHolderSerialization);

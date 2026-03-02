import { signSHA256 } from "@alksol/cfrg-bbs";
import { generateProofSha256 } from "@alksol/cfrg-bbs/deterministic";
import { base64url } from "jose";

import { seed32 } from "./deterministic.mjs";
import { keyRead } from "./bbs-key-load.mjs";
import {
    compactPayloadEncode,
    serializeJSON,
    writeUtf8,
    writeWrapped
} from "./output-writers.mjs";

import holderHeaderJSON from "./template/bbs-holder-header.json" with { type: "json" };
import issuerHeaderJSON from "./template/jpt-issuer-header.json" with { type: "json" };
import payloadsJSON from "./template/jpt-issuer-payloads.json" with { type: "json" };

const encode = base64url.encode;
const DISCLOSED_INDEXES = new Uint32Array([0, 1, 2, 3]);

async function loadInputs() {
    const keyPair = await keyRead();
    return {
        keyPair,
        issuerHeader: Buffer.from(serializeJSON(issuerHeaderJSON), "utf-8"),
        holderHeader: Buffer.from(serializeJSON(holderHeaderJSON), "utf-8"),
        payloads: payloadsJSON.map((item) => Buffer.from(serializeJSON(item), "utf-8"))
    };
}

function deriveValues({ keyPair, issuerHeader, holderHeader, payloads }) {
    const issuerPayloads = [...payloads];
    const signature = signSHA256(
        keyPair.secretKey,
        keyPair.publicKey.compressed,
        issuerHeader,
        issuerPayloads
    );

    const issuerCompact = [
        encode(issuerHeader),
        issuerPayloads.map(compactPayloadEncode).join("~"),
        encode(signature)
    ].join(".");

    const proof = generateProofSha256(
        keyPair.publicKey.compressed,
        signature,
        issuerHeader,
        holderHeader,
        issuerPayloads,
        DISCLOSED_INDEXES,
        seed32("bbs:proof-seed:v1")
    );

    const presentationPayloads = [...issuerPayloads];
    presentationPayloads[4] = null;
    presentationPayloads[5] = null;
    presentationPayloads[6] = null;

    const presentationCompact = [
        encode(holderHeader),
        encode(issuerHeader),
        presentationPayloads.map(compactPayloadEncode).join("~"),
        encode(proof)
    ].join(".");

    return {
        signature,
        issuerCompact,
        proof,
        presentationCompact
    };
}

async function writeOutputs({ signature, issuerCompact, proof, presentationCompact }) {
    await writeUtf8("build/bbs-issuer-proof.base64url", encode(signature));
    await writeUtf8("build/bbs-issuer-compact.jwp", issuerCompact);
    await writeWrapped("build/bbs-issuer-compact.jwp.wrapped", issuerCompact);

    await writeUtf8("build/bbs-presentation-proof.base64url", encode(proof));
    await writeUtf8("build/bbs-presentation-compact.jwp", presentationCompact);
    await writeWrapped("build/bbs-presentation-compact.jwp.wrapped", presentationCompact);
}

async function main() {
    const inputs = await loadInputs();
    const values = deriveValues(inputs);
    await writeOutputs(values);
}

await main();

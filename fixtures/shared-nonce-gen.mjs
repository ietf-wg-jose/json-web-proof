import { base64url } from "jose";
import * as fs from "node:fs/promises";

import { bytes32 } from "./deterministic.mjs";
import { writeJSON } from "./output-writers.mjs";

const encode = base64url.encode;

async function loadInputs() {
    await fs.mkdir("build", { recursive: true });
    return {};
}

function deriveValues() {
    return {
        issuerNonce: encode(bytes32("issuer-nonce:v1")),
        presentationNonce: encode(bytes32("presentation-nonce:v1"))
    };
}

async function writeOutputs({ issuerNonce, presentationNonce }) {
    await writeJSON("build/shared-issuer-nonce.base64url.json", issuerNonce);
    await writeJSON("build/shared-presentation-nonce.base64url.json", presentationNonce);
}

async function main() {
    await loadInputs();
    const values = deriveValues();
    await writeOutputs(values);
}

await main();

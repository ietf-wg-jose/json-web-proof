import { base64url } from "jose";
import * as fs from "node:fs/promises";

import { bytes32 } from "./deterministic.mjs";
import { writeJSON } from "./output-writers.mjs";

const encode = base64url.encode;

async function loadInputs() {
    await fs.mkdir("build", { recursive: true });
    await fs.rm("build/shared-issuer-nonce.base64url.json", { force: true });
    return {};
}

function deriveValues() {
    return {
        presentationNonce: encode(bytes32("presentation-nonce:v1"))
    };
}

async function writeOutputs({ presentationNonce }) {
    await writeJSON("build/shared-presentation-nonce.base64url.json", presentationNonce);
}

async function main() {
    await loadInputs();
    const values = deriveValues();
    await writeOutputs(values);
}

await main();

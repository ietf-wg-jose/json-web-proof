import { base64url } from "jose";
import * as fs from "node:fs/promises";

import { bytes32 } from "./deterministic.mjs";
import { writeJSON } from "./output-writers.mjs";

const { encode } = base64url;

async function loadInputs() {
    await fs.mkdir("build", { recursive: true });
    return {};
}

function deriveValues() {
    return {
        holderSharedSecret: encode(bytes32("mac-h256-holder-shared-secret:v1"))
    };
}

async function writeOutputs({ holderSharedSecret }) {
    await writeJSON(
        "build/mac-h256-holder-shared-secret.base64url.json",
        holderSharedSecret
    );
}

async function main() {
    await loadInputs();
    const values = deriveValues();
    await writeOutputs(values);
}

await main();

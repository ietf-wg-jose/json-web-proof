import { base64url } from 'jose';
import * as fs from "fs/promises";
import { bytes32 } from "./deterministic.mjs";
import { writeJSON } from "./output-writers.mjs";

const {encode} = base64url;

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

await writeJSON(
    "build/mac-h256-holder-shared-secret.base64url.json",
    encode(bytes32("mac-h256-holder-shared-secret:v1"))
);

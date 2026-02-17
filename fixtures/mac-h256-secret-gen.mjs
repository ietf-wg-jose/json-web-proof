import { base64url } from 'jose';
import * as fs from "fs/promises";
import { bytes32 } from "./deterministic.mjs";

const {encode} = base64url;

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

await fs.writeFile(
    "build/mac-h256-holder-shared-secret.json",
    JSON.stringify(encode(bytes32("mac-h256-holder-shared-secret:v1")))
);

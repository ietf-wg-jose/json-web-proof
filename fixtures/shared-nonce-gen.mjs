import { base64url } from 'jose';
import * as fs from "fs/promises";
import { bytes32 } from "./deterministic.mjs";
import { writeJSON } from "./utils.mjs";

const encode = base64url.encode;

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

await writeJSON("build/shared-issuer-nonce.base64url.json", encode(bytes32("issuer-nonce:v1")));
await writeJSON(
    "build/shared-presentation-nonce.base64url.json",
    encode(bytes32("presentation-nonce:v1"))
);

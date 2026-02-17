import { base64url } from 'jose';
import * as fs from "fs/promises";
import { bytes32 } from "./deterministic.mjs";

const encode = base64url.encode;

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

await fs.writeFile(
    "build/issuer-nonce.json",
    JSON.stringify(encode(bytes32("issuer-nonce:v1")))
);
await fs.writeFile(
    "build/presentation-nonce.json",
    JSON.stringify(encode(bytes32("presentation-nonce:v1")))
);

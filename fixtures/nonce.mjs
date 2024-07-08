import * as crypto from "crypto";
import { base64url } from 'jose';
import * as fs from "fs/promises";

const nonce = new Buffer.alloc(32);
const encode = base64url.encode;

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

crypto.getRandomValues(nonce);
await fs.writeFile(`build/issuer-nonce.json`, JSON.stringify(encode(nonce)));

crypto.getRandomValues(nonce);
await fs.writeFile(`build/presentation-nonce.json`, JSON.stringify(encode(nonce)));

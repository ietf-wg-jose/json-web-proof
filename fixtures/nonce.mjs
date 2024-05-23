import * as crypto from "crypto";
import { encode } from 'jose/util/base64url';
import * as fs from "fs/promises";

const nonce = new Buffer.alloc(32);

crypto.getRandomValues(nonce);
await fs.writeFile(`build/issuer-nonce.json`, JSON.stringify(encode(nonce)));

crypto.getRandomValues(nonce);
await fs.writeFile(`build/presentation-nonce.json`, JSON.stringify(encode(nonce)));

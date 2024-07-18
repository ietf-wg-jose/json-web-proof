import * as crypto from "crypto";
import { base64url } from 'jose';
import * as fs from "fs/promises";

const {encode, decode} = base64url;

const sharedSecret = new Buffer.alloc(32);

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

crypto.getRandomValues(sharedSecret);
await fs.writeFile(`build/mac-h256-holder-shared-secret.json`, JSON.stringify(encode(sharedSecret)));

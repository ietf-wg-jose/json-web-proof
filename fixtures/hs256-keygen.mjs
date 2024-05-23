// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import * as crypto from "node:crypto"

import {encode} from "jose/util/base64url"
import {lineWrap} from "./linewrap.mjs"
import fs from "node:fs/promises";
import { promisify } from "node:util";

var key = crypto.generateKeySync("hmac", {
    length: 128
});

// create "build" directory if doesn't exist

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }
const uglyKey = key.export({format: "jwk"});

var keyStr =
JSON.stringify({
    kty: "oct",
    use: "sign",
    k: encode(uglyKey.k)
}, null, 2);

await fs.writeFile("build/key-hs256.jwk", keyStr);
await fs.writeFile("build/key-hs256.jwk.wrapped", lineWrap(keyStr, 8));

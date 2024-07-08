// read the previous generated key from build/private-key.jwk

import { base64url } from "jose"
import fs from "fs/promises";

const decode = base64url.decode;

export async function keyRead() {
    let jwk = JSON.parse(await fs.readFile("build/private-key.jwk"));
    return {
        secretKey: decode(jwk.d),
        publicKey: decode(jwk.x)
    };
}

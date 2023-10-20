// read the previous generated key from build/private-key.jwk

import {decode} from "jose/util/base64url"
import fs from "fs/promises";

export async function keyRead() {
    let jwk = JSON.parse(await fs.readFile("build/private-key.jwk"));
    return {
        secretKey: decode(jwk.d),
        publicKey: decode(jwk.x)
    };
}
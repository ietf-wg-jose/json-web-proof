// read the previous generated key from build/bbs-private-key.jwk

import { base64url } from "jose";
import fs from "node:fs/promises";

const decode = base64url.decode;

export async function keyRead() {
    const jwk = JSON.parse(await fs.readFile("build/bbs-private-key.jwk", "utf-8"));
    const result = {
        secretKey: decode(jwk.d),
        publicKey: {
            x: decode(jwk.x)
        }
    };

    result.publicKey.compressed = result.publicKey.x;
    return result;
}

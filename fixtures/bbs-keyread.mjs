// read the previous generated key from build/private-key.jwk

import { base64url } from "jose"
import fs from "fs/promises";
import { utilities } from "@mattrglobal/pairing-crypto";

const decode = base64url.decode;

export async function keyRead() {
    let jwk = JSON.parse(await fs.readFile("build/private-key.jwk"));
    var result = {
        secretKey: decode(jwk.d),
        publicKey: {
            x: decode(jwk.x)
        }
    };
    result.publicKey.compressed = result.publicKey.x;
    return result;
}

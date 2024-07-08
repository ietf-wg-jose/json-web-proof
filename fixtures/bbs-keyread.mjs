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
            x: decode(jwk.x),
            y: decode(jwk.y)
        }
    };
    const uncompressed = Buffer.concat([result.publicKey.x, result.publicKey.y]);
    result.publicKey.uncompressed = uncompressed;
    result.publicKey.compressed = await utilities.uncompressedToCompressedPublicKey(uncompressed);
    return result;
}

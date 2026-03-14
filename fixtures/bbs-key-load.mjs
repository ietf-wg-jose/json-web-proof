// read the generated BBS private key from build/ and load it through the npm API

import fs from "node:fs/promises";
import { base64url } from "jose";

import { KeyPair } from "@alksol/cfrg-bbs";

async function readPrivateJwk() {
    return JSON.parse(await fs.readFile("build/bbs-private-key.jwk", "utf-8"));
}

export async function keyRead() {
    const jwk = await readPrivateJwk();
    const keyPair = KeyPair.fromJoseKey(JSON.stringify(jwk));
    const publicKey = base64url.decode(jwk.x);

    return {
        keyPair,
        publicKey
    };
}

// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import {bbs, utilities} from "@mattrglobal/pairing-crypto"
import {base64url} from "jose";
import {lineWrap} from "./utils.mjs"
import fs from "node:fs/promises";

const encode = base64url.encode
var keys = await bbs.bls12381_sha256.generateKeyPairUncompressed();
var publicKeyX = keys.publicKey.slice(0, keys.publicKey.length/2);
var publicKeyY = keys.publicKey.slice(keys.publicKey.length/2, keys.publicKey.length);
// var concat = Buffer.concat([publicKeyX, publicKeyY]);
// console.debug(await utilities.uncompressedToCompressedPublicKey(concat));

// create "build" directory if doesn't exist

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

var privateKeyStr = 
JSON.stringify({
    kty: "EC2",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: encode(publicKeyX),
    y: encode(publicKeyY),
    d: encode(keys.secretKey)
}, null, 2);

await fs.writeFile("build/private-key.jwk", privateKeyStr);
await fs.writeFile("build/private-key.jwk.wrapped", lineWrap(privateKeyStr, 8));

var publicKeyStr = 
JSON.stringify({
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: encode(publicKeyX),
    y: encode(publicKeyY)
}, null, 2);

await fs.writeFile("build/public-key.jwk", publicKeyStr);
await fs.writeFile("build/public-key.jwk.wrapped", lineWrap(publicKeyStr, 8));

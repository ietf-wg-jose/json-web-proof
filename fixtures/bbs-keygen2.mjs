// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
// import {bbs, utilities} from "@mattrglobal/pairing-crypto"
import { CTX } from "amcl-js";
import {base64url} from "jose";
import {lineWrap} from "./utils.mjs"
import fs from "node:fs/promises";
import { assert } from "node:console";

const encode = base64url.encode
var keys = await bbs.bls12381_sha256.generateKeyPair();
var publicKeyX = await utilities.uncompressedToCompressedPublicKey(keys.publicKey);
var publicKeyStr = encode(publicKeyX);
var secretKeyStr = encode(keys.secretKey);

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

var privateKeyStr = 
JSON.stringify({
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: publicKeyStr,
    d: secretKeyStr
}, null, 2);

await fs.writeFile("build/private-key.jwk", privateKeyStr);
await fs.writeFile("build/private-key.jwk.wrapped", lineWrap(privateKeyStr, 8));

var publicKeyStr = 
JSON.stringify({
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: encode(publicKeyX)
}, null, 2);

await fs.writeFile("build/public-key.jwk", publicKeyStr);
await fs.writeFile("build/public-key.jwk.wrapped", lineWrap(publicKeyStr, 8));

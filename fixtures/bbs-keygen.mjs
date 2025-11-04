// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import {bbs, utilities} from "@mattrglobal/pairing-crypto"
import {base64url} from "jose";
import {lineWrap} from "./utils.mjs"
import fs from "node:fs/promises";
import { assert } from "node:console";
import { encode as cborEncode, diagnose } from "cbor2";

const encode = base64url.encode
var keys = await bbs.bls12381_sha256.generateKeyPair();
var publicKeyX = await utilities.uncompressedToCompressedPublicKey(keys.publicKey);
var publicKeyStr = encode(publicKeyX);

// reverse secretKey to big endian
keys.secretKey.reverse();
assert(keys.secretKey.length == 32);

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

const cborPrivateKey = new Map();
cborPrivateKey.set(1, 1); // kty = OKP
cborPrivateKey.set(-1, 14 ); // crv = BLS12381G2
cborPrivateKey.set(-2, publicKeyX ); // x = ...
cborPrivateKey.set(-4, keys.secretKey ); // d = ...

var encodedCborPrivateKey = cborEncode(cborPrivateKey);

await fs.writeFile("build/private-key.jwk", privateKeyStr);
await fs.writeFile("build/private-key.jwk.wrapped", lineWrap(privateKeyStr, 8));
await fs.writeFile("build/private-key.cwk", encodedCborPrivateKey);
await fs.writeFile("build/private-key.cwk.edn", diagnose(encodedCborPrivateKey, { pretty: true }));

var publicKeyStr = 
JSON.stringify({
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: encode(publicKeyX)
}, null, 2);

const cborPublicKey = new Map();

cborPublicKey.set(1, 1); // kty = OKP
cborPublicKey.set(-1, 14 ); // crv = BLS12381G2
cborPublicKey.set(-2, publicKeyX ); // x = ...

var encodedCborPublicKey = cborEncode(cborPublicKey);

await fs.writeFile("build/public-key.jwk", publicKeyStr);
await fs.writeFile("build/public-key.jwk.wrapped", lineWrap(publicKeyStr, 8));
await fs.writeFile("build/public-key.cwk", encodedCborPublicKey);
await fs.writeFile("build/public-key.cwk.edn", diagnose(encodedCborPublicKey, { pretty: true }));

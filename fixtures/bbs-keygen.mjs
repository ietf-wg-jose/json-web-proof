// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import { generateKeyPairSha256 } from "@alksol/cfrg-bbs";
import {base64url} from "jose";
import {lineWrap} from "./utils.mjs"
import fs from "node:fs/promises";
import { encode as cborEncode, diagnose } from "cbor2";

const encode = base64url.encode
const keyPair = generateKeyPairSha256();
const publicKeyX = keyPair.getPublicKey();
const secretKey = keyPair.getSecretKey();
const publicKeyStr = encode(publicKeyX);
const secretKeyStr = encode(secretKey);

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

const privateJwk = {
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: publicKeyStr,
    d: secretKeyStr
};
const privateKeyStr = JSON.stringify(privateJwk, null, 2);

const cborPrivateKey = new Map();
cborPrivateKey.set(1, 1); // kty = OKP
cborPrivateKey.set(-1, 14 ); // crv = BLS12381G2
cborPrivateKey.set(-2, publicKeyX ); // x = ...
cborPrivateKey.set(-4, secretKey ); // d = ...

const encodedCborPrivateKey = cborEncode(cborPrivateKey);

await fs.writeFile("build/private-key.jwk", privateKeyStr);
await fs.writeFile("build/private-key.jwk.wrapped", lineWrap(privateKeyStr, 8));
await fs.writeFile("build/private-key.cwk", encodedCborPrivateKey);
await fs.writeFile("build/private-key.cwk.edn", diagnose(encodedCborPrivateKey, { pretty: true }));

const publicJwk = {
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: publicKeyStr
};
const publicKeyJson = JSON.stringify(publicJwk, null, 2);

const cborPublicKey = new Map();

cborPublicKey.set(1, 1); // kty = OKP
cborPublicKey.set(-1, 14 ); // crv = BLS12381G2
cborPublicKey.set(-2, publicKeyX ); // x = ...

const encodedCborPublicKey = cborEncode(cborPublicKey);

await fs.writeFile("build/public-key.jwk", publicKeyJson);
await fs.writeFile("build/public-key.jwk.wrapped", lineWrap(publicKeyJson, 8));
await fs.writeFile("build/public-key.cwk", encodedCborPublicKey);
await fs.writeFile("build/public-key.cwk.edn", diagnose(encodedCborPublicKey, { pretty: true }));

// generate BBS key artifacts in JWK and CWK forms
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import { KeyPair } from "@alksol/cfrg-bbs";
import {base64url} from "jose";
import { writeBinary, writeJSON, writeUtf8, writeWrappedJSON } from "./utils.mjs"
import fs from "node:fs/promises";
import { encode as cborEncode, diagnose } from "cbor2";
import { seed32 } from "./deterministic.mjs";

const encode = base64url.encode
const keyPair = KeyPair.fromKeyMaterialSha256(
    seed32("bbs:key-material:v1")
);
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

const cborPrivateKey = new Map();
cborPrivateKey.set(1, 1); // kty = OKP
cborPrivateKey.set(-1, 14 ); // crv = BLS12381G2
cborPrivateKey.set(-2, publicKeyX ); // x = ...
cborPrivateKey.set(-4, secretKey ); // d = ...

const encodedCborPrivateKey = cborEncode(cborPrivateKey);

await writeJSON("build/bbs-private-key.jwk", privateJwk, { pretty: true });
await writeWrappedJSON("build/bbs-private-key.jwk.wrapped", privateJwk, {
    pretty: true,
    paddingLength: 8
});
await writeBinary("build/bbs-private-key.cwk", encodedCborPrivateKey);
await writeUtf8("build/bbs-private-key.cwk.edn", diagnose(encodedCborPrivateKey, { pretty: true }));

const publicJwk = {
    kty: "OKP",
    alg: "BBS",
    use: "proof",
    crv: "BLS12381G2",
    x: publicKeyStr
};

const cborPublicKey = new Map();

cborPublicKey.set(1, 1); // kty = OKP
cborPublicKey.set(-1, 14 ); // crv = BLS12381G2
cborPublicKey.set(-2, publicKeyX ); // x = ...

const encodedCborPublicKey = cborEncode(cborPublicKey);

await writeJSON("build/bbs-public-key.jwk", publicJwk, { pretty: true });
await fs.rm("build/bbs-public-key.jwk.wrapped", { force: true });
await writeBinary("build/bbs-public-key.cwk", encodedCborPublicKey);
await writeUtf8("build/bbs-public-key.cwk.edn", diagnose(encodedCborPublicKey, { pretty: true }));

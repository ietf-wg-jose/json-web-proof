// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import * as crypto from "node:crypto"

import {base64url} from "jose";
import {lineWrap} from "./utils.mjs"
import fs from "node:fs/promises";
import { validP256PrivateKey } from "./deterministic.mjs";

const encode = base64url.encode;

import { argv, exit } from "process";

if (argv.length != 3) {
    console.error("Must call with single key name argument");
    process.exit(-1);
}

if (argv[2].includes("/")) {
    console.error("fatal error - cannot include pathing");
    process.exit(-2);
}
// create "build" directory if doesn't exist

try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

const keyName = argv[2];
const privateScalar = validP256PrivateKey(`es256:${keyName}:private:v1`);
const ecdh = crypto.createECDH("prime256v1");
ecdh.setPrivateKey(privateScalar);
const publicKey = ecdh.getPublicKey(undefined, "uncompressed");
const x = publicKey.subarray(1, 33);
const y = publicKey.subarray(33, 65);

var privateKeyStr =
JSON.stringify({
    kty: "EC",
    crv: "P-256",
    x: encode(x),
    y: encode(y),
    d: encode(privateScalar)
}, null, 2);

await fs.writeFile(`build/${keyName}-private-key-es256.jwk.json`, privateKeyStr);
await fs.writeFile(`build/${keyName}-private-key-es256.jwk.wrapped`, lineWrap(privateKeyStr, 8));

var publicKeyStr = 
JSON.stringify({
    kty: "EC",
    crv: "P-256",
    use: "sign",
    x: encode(x),
    y: encode(y)
}, null, 2);

await fs.writeFile(`build/${keyName}-public-key-es256.jwk.json`, publicKeyStr);
await fs.writeFile(`build/${keyName}-public-key-es256.jwk.wrapped`, lineWrap(publicKeyStr, 8));

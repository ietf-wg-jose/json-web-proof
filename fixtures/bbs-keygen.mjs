// generate BBS key artifacts in JWK and CWK forms
// containing a BLS curve key pair usable for issuance, based on
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import fs from "node:fs/promises";

import { KeyPair } from "@alksol/cfrg-bbs";
import { encode as cborEncode, diagnose } from "cbor2";
import { base64url } from "jose";

import { seed32 } from "./deterministic.mjs";
import {
    writeBinary,
    writeJSON,
    writeUtf8,
    writeWrappedJSON
} from "./output-writers.mjs";

const encode = base64url.encode;

async function loadInputs() {
    await fs.mkdir("build", { recursive: true });
    return {};
}

function deriveValues() {
    const keyPair = KeyPair.fromKeyMaterialSha256(seed32("bbs:key-material:v1"));
    const publicKeyX = keyPair.getPublicKey();
    const secretKey = keyPair.getSecretKey();

    const privateJwk = {
        kty: "OKP",
        alg: "BBS",
        use: "proof",
        crv: "BLS12381G2",
        x: encode(publicKeyX),
        d: encode(secretKey)
    };

    const privateCwk = new Map();
    privateCwk.set(1, 1);
    privateCwk.set(-1, 14);
    privateCwk.set(-2, publicKeyX);
    privateCwk.set(-4, secretKey);

    const publicJwk = {
        kty: "OKP",
        alg: "BBS",
        use: "proof",
        crv: "BLS12381G2",
        x: encode(publicKeyX)
    };

    const publicCwk = new Map();
    publicCwk.set(1, 1);
    publicCwk.set(-1, 14);
    publicCwk.set(-2, publicKeyX);

    return {
        privateJwk,
        privateCwkBinary: cborEncode(privateCwk),
        publicJwk,
        publicCwkBinary: cborEncode(publicCwk)
    };
}

async function writeOutputs({ privateJwk, privateCwkBinary, publicJwk, publicCwkBinary }) {
    await writeJSON("build/bbs-private-key.jwk", privateJwk, { pretty: true });
    await writeWrappedJSON("build/bbs-private-key.jwk.wrapped", privateJwk, {
        pretty: true,
        paddingLength: 8
    });
    await writeBinary("build/bbs-private-key.cwk", privateCwkBinary);
    await writeUtf8(
        "build/bbs-private-key.cwk.edn",
        diagnose(privateCwkBinary, { pretty: true })
    );

    await writeJSON("build/bbs-public-key.jwk", publicJwk, { pretty: true });
    await fs.rm("build/bbs-public-key.jwk.wrapped", { force: true });
    await writeBinary("build/bbs-public-key.cwk", publicCwkBinary);
    await writeUtf8(
        "build/bbs-public-key.cwk.edn",
        diagnose(publicCwkBinary, { pretty: true })
    );
}

async function main() {
    await loadInputs();
    const values = deriveValues();
    await writeOutputs(values);
}

await main();

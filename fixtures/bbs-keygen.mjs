// generate BBS key artifacts from the library-native key material, then add
// JWP-specific proof_alg decoration locally
import fs from "node:fs/promises";
import { PublicKey, SigningKey } from "@alksol/cfrg-bbs";
import { decode as cborDecode, encode as cborEncode, diagnose } from "cbor2";

import { seed32 } from "./deterministic.mjs";
import {
    writeBinary,
    writeJSON,
    writeUtf8,
    writeWrappedJSON
} from "./output-writers.mjs";

const PROOF_ALG_CWK_LABEL = 7;
const PROOF_ALG_CWK_VALUE = 4;

async function loadInputs() {
    await fs.mkdir("build", { recursive: true });
    return {};
}

function addProofAlgToJwk(jwk) {
    return {
        ...jwk,
        proof_alg: "BBS"
    };
}

function addProofAlgToCwk(cwk, { includePrivateKey }) {
    const publicKeyBytes = new Uint8Array(cwk.get(-2));
    const decorated = new Map();
    decorated.set(1, cwk.get(1));
    decorated.set(PROOF_ALG_CWK_LABEL, PROOF_ALG_CWK_VALUE);
    decorated.set(-1, cwk.get(-1));
    decorated.set(-2, publicKeyBytes);
    if (includePrivateKey) {
        decorated.set(-4, new Uint8Array(cwk.get(-4)));
    }
    return decorated;
}

function deriveValues() {
    const signingKey = SigningKey.fromKeyMaterial(seed32("bbs:key-material:v1"));
    const publicKey = PublicKey.fromBytes(signingKey.getPublicKey());

    const privateJwk = addProofAlgToJwk(JSON.parse(signingKey.toJoseKey()));
    const publicJwk = addProofAlgToJwk(JSON.parse(publicKey.toJoseKey()));

    const privateCwk = addProofAlgToCwk(cborDecode(Buffer.from(signingKey.toCoseKey())), {
        includePrivateKey: true
    });
    const publicCwk = addProofAlgToCwk(cborDecode(Buffer.from(publicKey.toCoseKey())), {
        includePrivateKey: false
    });

    return {
        privateJwk,
        privateCwkBinary: cborEncode(privateCwk),
        publicJwk,
        publicCwkBinary: cborEncode(publicCwk)
    };
}

async function main() {
    await loadInputs();
    const values = deriveValues();
    await writeJSON("build/bbs-private-key.jwk", values.privateJwk, { pretty: true });
    await writeWrappedJSON("build/bbs-private-key.jwk.wrapped", values.privateJwk, {
        pretty: true,
        paddingLength: 8
    });
    await writeBinary("build/bbs-private-key.cwk", values.privateCwkBinary);
    await writeUtf8(
        "build/bbs-private-key.cwk.edn",
        diagnose(values.privateCwkBinary, { pretty: true })
    );

    await writeJSON("build/bbs-public-key.jwk", values.publicJwk, { pretty: true });
    await fs.rm("build/bbs-public-key.jwk.wrapped", { force: true });
    await writeBinary("build/bbs-public-key.cwk", values.publicCwkBinary);
    await writeUtf8(
        "build/bbs-public-key.cwk.edn",
        diagnose(values.publicCwkBinary, { pretty: true })
    );
}

await main();

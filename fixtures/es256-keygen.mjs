import { argv } from "process";
import * as crypto from "node:crypto";
import fs from "node:fs/promises";

import { base64url } from "jose";

import { validP256PrivateKey } from "./deterministic.mjs";
import { writeJSON, writeWrappedJSON } from "./output-writers.mjs";

const encode = base64url.encode;

function loadInputs() {
    if (argv.length !== 3) {
        throw new Error("Must call with single key name argument");
    }

    if (argv[2].includes("/")) {
        throw new Error("fatal error - cannot include pathing");
    }

    return { keyName: argv[2] };
}

function deriveValues({ keyName }) {
    const privateScalar = validP256PrivateKey(`es256:${keyName}:private:v1`);
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.setPrivateKey(privateScalar);
    const publicKey = ecdh.getPublicKey(undefined, "uncompressed");
    const x = publicKey.subarray(1, 33);
    const y = publicKey.subarray(33, 65);

    return {
        keyName,
        privateJwk: {
            kty: "EC",
            crv: "P-256",
            x: encode(x),
            y: encode(y),
            d: encode(privateScalar)
        },
        publicJwk: {
            kty: "EC",
            crv: "P-256",
            use: "sign",
            x: encode(x),
            y: encode(y)
        }
    };
}

async function writeOutputs({ keyName, privateJwk, publicJwk }) {
    await fs.mkdir("build", { recursive: true });

    await writeJSON(
        `build/es256-${keyName}-private-key.jwk.json`,
        privateJwk,
        { pretty: true }
    );
    await writeWrappedJSON(
        `build/es256-${keyName}-private-key.jwk.wrapped`,
        privateJwk,
        { pretty: true, paddingLength: 8 }
    );

    await writeJSON(
        `build/es256-${keyName}-public-key.jwk.json`,
        publicJwk,
        { pretty: true }
    );
    await fs.rm(`build/es256-${keyName}-public-key.jwk.wrapped`, { force: true });
}

async function main() {
    try {
        const inputs = loadInputs();
        const values = deriveValues(inputs);
        await writeOutputs(values);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

await main();

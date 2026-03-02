import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";

import * as cborEdn from "cbor-edn";
import * as cbor from "cbor2";
import { registerEncoder } from "cbor2/encoder";
import { base64url } from "jose";

import {
    createPresentationInternalRepresentation,
    signPayloadSHA256
} from "./crypto-ops.mjs";
import { writeBinary, writeUtf8 } from "./output-writers.mjs";

import ephemeralPrivateKeyJSON from "./build/es256-ephemeral-private-key.jwk.json" with { type: "json" };
import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with { type: "json" };
import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with { type: "json" };
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with { type: "json" };

const { encode, decode } = base64url;

registerEncoder(Buffer, (b) => [
    NaN,
    new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
]);

function uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function base64urlToHex(value) {
    return uint8ArrayToHex(decode(value));
}

function cborBinaryFromString(cborEdnStr, filename) {
    return cborEdn.parseEDN(cborEdnStr, {
        grammarSource: filename,
        validateUTF8: true
    });
}

function cborFromString(cborEdnStr, filename) {
    return cbor.decode(cborBinaryFromString(cborEdnStr, filename), {
        rejectBigInts: true,
        rejectDuplicateKeys: true,
        rejectFloats: true,
        rejectLargeNegatives: true,
        rejectSimple: true,
        rejectStreaming: true,
        rejectUndefined: true
    });
}

async function cborFromFile(filename) {
    return cborFromString(await fs.readFile(filename, { encoding: "utf-8" }), filename);
}

function wrapHexLines(bytes) {
    const hex = uint8ArrayToHex(bytes);
    return [...hex.matchAll(/.{1,64}/g)].flatMap((m) => m).join("\n");
}

function loadInputs() {
    return {
        presentationNonce: decode(presentationNonceStr),
        issuerPrivateKey: crypto.createPrivateKey({
            key: issuerPrivateKeyJSON,
            format: "jwk"
        }),
        holderPrivateKey: crypto.createPrivateKey({
            key: holderPrivateKeyJSON,
            format: "jwk"
        }),
        ephemeralPrivateKey: crypto.createPrivateKey({
            key: ephemeralPrivateKeyJSON,
            format: "jwk"
        })
    };
}

async function deriveValues({ presentationNonce, issuerPrivateKey, holderPrivateKey, ephemeralPrivateKey }) {
    const issuerHeaderText = (
        await fs.readFile("./template/cpt-issuer-header.edn", { encoding: "utf-8" })
    )
        .replace(
            "/ iek-x /",
            "-2: h'" + base64urlToHex(ephemeralPrivateKeyJSON.x).match(/.{1,56}/g).join("' +\n        h'") + "', / x /"
        )
        .replace(
            "/ iek-y /",
            "-3: h'" + base64urlToHex(ephemeralPrivateKeyJSON.y).match(/.{1,56}/g).join("' +\n        h'") + "'  / y /"
        )
        .replace(
            "/ hpk-x /",
            "-2: h'" + base64urlToHex(holderPrivateKeyJSON.x).match(/.{1,56}/g).join("' +\n        h'") + "', / x /"
        )
        .replace(
            "/ hpk-y /",
            "-3: h'" + base64urlToHex(holderPrivateKeyJSON.y).match(/.{1,56}/g).join("' +\n        h'") + "'  / y /"
        );

    const issuerHeaderOctets = cborBinaryFromString(
        issuerHeaderText,
        "./build/cpt-issuer-header.edn"
    );
    const issuerPayloads = await cborFromFile("./template/cpt-issuer-payloads.edn");
    const payloadOctets = issuerPayloads.map((item) => cbor.encode(item));

    const issuerSigs = [];
    issuerSigs.push(await signPayloadSHA256(issuerHeaderOctets, issuerPrivateKey));
    for (const payload of payloadOctets) {
        issuerSigs.push(await signPayloadSHA256(payload, ephemeralPrivateKey));
    }

    const issuedFormCbor = cbor.encode([
        issuerHeaderOctets,
        issuerPayloads,
        issuerSigs
    ]);

    const holderHeaderText = (
        await fs.readFile("./template/cpt-holder-header.edn", { encoding: "utf-8" })
    ).replace(
        "/ nonce /",
        "7: h'" + uint8ArrayToHex(presentationNonce) + "', / nonce /"
    );

    const holderHeaderOctets = cborBinaryFromString(
        holderHeaderText,
        "./build/cpt-holder-header.edn"
    );

    const presentationPayloads = [...issuerPayloads];
    presentationPayloads[7] = null;
    presentationPayloads[8] = null;

    const presentationInternal = createPresentationInternalRepresentation(
        issuerHeaderOctets,
        holderHeaderOctets,
        presentationPayloads,
        issuerSigs
    );

    const presentationPop = await signPayloadSHA256(presentationInternal, holderPrivateKey);

    const presentationSigs = [...issuerSigs];
    presentationSigs.splice(6, 2);
    presentationSigs.push(presentationPop);

    const presentedFormCbor = cbor.encode([
        holderHeaderOctets,
        issuerHeaderOctets,
        presentationPayloads,
        presentationSigs
    ]);

    return {
        issuerHeaderText,
        holderHeaderText,
        issuedFormCbor,
        presentationPop,
        presentedFormCbor
    };
}

async function writeOutputs({
    issuerHeaderText,
    holderHeaderText,
    issuedFormCbor,
    presentationPop,
    presentedFormCbor
}) {
    await writeUtf8("./build/cpt-issuer-header.edn", issuerHeaderText);
    await writeBinary("./build/cpt-issuer-form.cbor", issuedFormCbor);
    await writeUtf8("./build/cpt-issuer-form.cbor.hex", wrapHexLines(issuedFormCbor));

    await writeUtf8("./build/cpt-holder-header.edn", holderHeaderText);

    await writeUtf8("build/cpt-presentation-pop.base64url", encode(presentationPop));
    await fs.rm("build/cpt-presentation-pop.base64url.wrapped", { force: true });

    await writeBinary("./build/cpt-presentation-form.cbor", presentedFormCbor);
    await writeUtf8("./build/cpt-presentation-form.cbor.hex", wrapHexLines(presentedFormCbor));
}

async function main() {
    const inputs = loadInputs();
    const values = await deriveValues(inputs);
    await writeOutputs(values);
}

await main();

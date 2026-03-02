import fs from "node:fs/promises";
import * as crypto from "node:crypto";

import { base64url } from "jose";

import {
    createPresentationInternalRepresentation,
    signPayloadSHA256
} from "./crypto-ops.mjs";
import {
    compactPayloadEncode,
    serializeJSON,
    writeJSON,
    writeUtf8,
    writeWrapped,
    writeWrappedJSON
} from "./output-writers.mjs";

import ephemeralPrivateKeyJSON from "./build/es256-ephemeral-private-key.jwk.json" with { type: "json" };
import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with { type: "json" };
import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with { type: "json" };
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with { type: "json" };
import holderHeaderTemplate from "./template/su-es256-holder-header.json" with { type: "json" };
import issuerHeaderTemplate from "./template/su-es256-issuer-header.json" with { type: "json" };
import payloadsJSON from "./template/jpt-issuer-payloads.json" with { type: "json" };

const { encode } = base64url;

function loadInputs() {
    const payloads = payloadsJSON.map((item) => Buffer.from(serializeJSON(item), "utf-8"));
    const issuerPrivateKey = crypto.createPrivateKey({
        key: issuerPrivateKeyJSON,
        format: "jwk"
    });
    const holderPrivateKey = crypto.createPrivateKey({
        key: holderPrivateKeyJSON,
        format: "jwk"
    });
    const ephemeralPrivateKey = crypto.createPrivateKey({
        key: ephemeralPrivateKeyJSON,
        format: "jwk"
    });

    return {
        payloads,
        issuerPrivateKey,
        holderPrivateKey,
        ephemeralPrivateKey,
        issuerHeaderJSON: structuredClone(issuerHeaderTemplate),
        holderHeaderJSON: structuredClone(holderHeaderTemplate)
    };
}

async function deriveValues({
    payloads,
    issuerPrivateKey,
    holderPrivateKey,
    ephemeralPrivateKey,
    issuerHeaderJSON,
    holderHeaderJSON
}) {
    const issuerPayloads = [...payloads];
    const issuerProofs = [];

    issuerHeaderJSON.iek = structuredClone(ephemeralPrivateKeyJSON);
    delete issuerHeaderJSON.iek.d;

    issuerHeaderJSON.hpk = structuredClone(holderPrivateKeyJSON);
    delete issuerHeaderJSON.hpk.d;

    const issuerHeader = Buffer.from(serializeJSON(issuerHeaderJSON), "utf-8");

    issuerProofs.push(await signPayloadSHA256(issuerHeader, issuerPrivateKey));
    for (const payload of issuerPayloads) {
        issuerProofs.push(await signPayloadSHA256(payload, ephemeralPrivateKey));
    }

    const issuerCompact = [
        encode(issuerHeader),
        issuerPayloads.map(compactPayloadEncode).join("~"),
        issuerProofs.map(encode).join("~")
    ].join(".");

    holderHeaderJSON.nonce = presentationNonceStr;
    const holderHeader = Buffer.from(serializeJSON(holderHeaderJSON), "utf-8");

    const presentationPayloads = [...issuerPayloads];
    presentationPayloads[7] = null;
    presentationPayloads[8] = null;

    const presentationProofs = [...issuerProofs];
    const presentationInternal = createPresentationInternalRepresentation(
        issuerHeader,
        holderHeader,
        presentationPayloads,
        presentationProofs
    );
    const holderSignature = await signPayloadSHA256(presentationInternal, holderPrivateKey);

    presentationProofs.splice(6, 2);
    presentationProofs.push(holderSignature);

    const presentationCompact = [
        encode(holderHeader),
        encode(issuerHeader),
        presentationPayloads.map(compactPayloadEncode).join("~"),
        presentationProofs.map(encode).join("~")
    ].join(".");

    return {
        issuerHeaderJSON,
        holderHeaderJSON,
        issuerHeader,
        holderHeader,
        issuerProofs,
        issuerCompact,
        holderSignature,
        presentationProofs,
        presentationCompact
    };
}

async function writeOutputs({
    issuerHeaderJSON,
    holderHeaderJSON,
    issuerHeader,
    holderHeader,
    issuerProofs,
    issuerCompact,
    holderSignature,
    presentationProofs,
    presentationCompact
}) {
    await writeJSON("build/su-es256-issuer-header.json", issuerHeaderJSON, { pretty: true });
    await writeWrappedJSON("build/su-es256-issuer-header.json.wrapped", issuerHeaderJSON, {
        pretty: true
    });
    await writeWrapped("build/su-es256-issuer-header.base64url.wrapped", encode(issuerHeader));

    await writeJSON("build/su-es256-issuer-proof.json", issuerProofs.map(encode), { pretty: true });
    await fs.rm("build/su-es256-issuer-proof.json.wrapped", { force: true });

    await writeUtf8("build/su-es256-issuer-compact.jwp", issuerCompact);
    await writeWrapped("build/su-es256-issuer-compact.jwp.wrapped", issuerCompact);

    await writeJSON("build/su-es256-holder-header.json", holderHeaderJSON, { pretty: true });
    await writeWrappedJSON("build/su-es256-holder-header.json.wrapped", holderHeaderJSON, {
        pretty: true
    });
    await writeWrapped("build/su-es256-holder-header.base64url.wrapped", encode(holderHeader));

    await writeUtf8("build/su-es256-presentation-pop.base64url", encode(holderSignature));
    await fs.rm("build/su-es256-presentation-pop.base64url.wrapped", { force: true });

    await writeJSON("build/su-es256-presentation-proof.json", presentationProofs.map(encode), {
        pretty: true
    });
    await fs.rm("build/su-es256-presentation-proof.json.wrapped", { force: true });

    await writeUtf8("build/su-es256-presentation-compact.jwp", presentationCompact);
    await writeWrapped("build/su-es256-presentation-compact.jwp.wrapped", presentationCompact);
}

async function main() {
    const inputs = loadInputs();
    const values = await deriveValues(inputs);
    await writeOutputs(values);
}

await main();

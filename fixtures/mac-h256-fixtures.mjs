import * as crypto from "node:crypto";

import { base64url } from "jose";

import {
    combinedMACRepresentation,
    createPresentationInternalRepresentation,
    payloadMACs,
    payloadSecrets,
    signPayloadSHA256
} from "./crypto-ops.mjs";
import {
    compactPayloadEncode,
    serializeJSON,
    writeJSON,
    writeWrapped,
    writeWrappedJSON
} from "./output-writers.mjs";

import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with { type: "json" };
import holderPublicKeyJSON from "./build/es256-holder-public-key.jwk.json" with { type: "json" };
import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with { type: "json" };
import holderSharedSecretStr from "./build/mac-h256-holder-shared-secret.base64url.json" with { type: "json" };
import issuerNonceStr from "./build/shared-issuer-nonce.base64url.json" with { type: "json" };
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with { type: "json" };
import holderHeaderTemplate from "./template/mac-h256-holder-header.json" with { type: "json" };
import issuerHeaderTemplate from "./template/mac-h256-issuer-header.json" with { type: "json" };
import payloadsJSON from "./template/jpt-issuer-payloads.json" with { type: "json" };

const { encode, decode } = base64url;
const REDACTED_PAYLOAD_INDEXES = new Set([4, 5, 6]);

function loadInputs() {
    const payloads = payloadsJSON.map((item) => Buffer.from(serializeJSON(item), "utf-8"));

    return {
        payloads,
        issuerNonce: decode(issuerNonceStr),
        presentationNonce: decode(presentationNonceStr),
        holderSharedSecret: decode(holderSharedSecretStr),
        issuerPrivateKey: crypto.createPrivateKey({
            key: issuerPrivateKeyJSON,
            format: "jwk"
        }),
        holderPrivateKey: crypto.createPrivateKey({
            key: holderPrivateKeyJSON,
            format: "jwk"
        }),
        issuerHeaderJSON: structuredClone(issuerHeaderTemplate),
        holderHeaderJSON: structuredClone(holderHeaderTemplate)
    };
}

async function deriveValues({
    payloads,
    issuerNonce,
    presentationNonce,
    holderSharedSecret,
    issuerPrivateKey,
    holderPrivateKey,
    issuerHeaderJSON,
    holderHeaderJSON
}) {
    const issuerPayloads = [...payloads];

    issuerHeaderJSON.hpk = holderPublicKeyJSON;
    const issuerHeader = serializeJSON(issuerHeaderJSON);

    const payloadKeys = payloadSecrets("sha256", issuerNonce, issuerPayloads.length);
    const payloadMacs = payloadMACs("sha256", payloadKeys, issuerPayloads);

    const combinedMacRepresentation = combinedMACRepresentation(issuerHeader, payloadMacs);
    const macsSignature = await signPayloadSHA256(combinedMacRepresentation, issuerPrivateKey);
    const issuedProof = [macsSignature, holderSharedSecret];

    const issuerCompact = [
        encode(issuerHeader),
        issuerPayloads.map(compactPayloadEncode).join("~"),
        issuedProof.map(encode).join("~")
    ].join(".");

    holderHeaderJSON.nonce = encode(presentationNonce);
    const holderHeader = Buffer.from(serializeJSON(holderHeaderJSON), "utf-8");

    const presentationPayloads = [...issuerPayloads];
    const presentationProof = [macsSignature];

    for (let i = 0; i < presentationPayloads.length; i += 1) {
        const redacted = REDACTED_PAYLOAD_INDEXES.has(i);
        if (redacted) {
            presentationPayloads[i] = null;
            presentationProof.push(payloadMacs[i]);
        } else {
            presentationProof.push(payloadKeys[i]);
        }
    }

    const presentationInternalRepresentation = createPresentationInternalRepresentation(
        issuerHeader,
        holderHeader,
        presentationPayloads,
        presentationProof
    );

    const presentationHolderSignature = await signPayloadSHA256(
        presentationInternalRepresentation,
        holderPrivateKey
    );
    presentationProof.push(presentationHolderSignature);

    const presentationCompact = [
        encode(holderHeader),
        encode(issuerHeader),
        presentationPayloads.map(compactPayloadEncode).join("~"),
        presentationProof.map(encode).join("~")
    ].join(".");

    return {
        issuerHeaderJSON,
        holderHeaderJSON,
        payloadKeys,
        payloadMacs,
        issuedProof,
        issuerCompact,
        presentationProof,
        presentationCompact
    };
}

async function writeOutputs({
    issuerHeaderJSON,
    holderHeaderJSON,
    payloadKeys,
    payloadMacs,
    issuedProof,
    issuerCompact,
    presentationProof,
    presentationCompact
}) {
    await writeJSON("build/mac-h256-issuer-header.json", issuerHeaderJSON, {
        pretty: true
    });

    await writeJSON("build/mac-h256-issuer-payload-keys.json", payloadKeys.map(encode), {
        pretty: true
    });
    await writeJSON("build/mac-h256-payload-macs.json", payloadMacs.map(encode), {
        pretty: true
    });

    await writeWrappedJSON("build/mac-h256-issuer-proof.json.wrapped", issuedProof.map(encode), {
        pretty: true
    });
    await writeWrapped("build/mac-h256-issuer-compact.jwp.wrapped", issuerCompact);

    await writeWrappedJSON("build/mac-h256-holder-header.json.wrapped", holderHeaderJSON, {
        pretty: true
    });

    await writeWrappedJSON(
        "build/mac-h256-presentation-proof.json.wrapped",
        presentationProof.map(encode),
        { pretty: true }
    );
    await writeWrapped("build/mac-h256-presentation-compact.jwp.wrapped", presentationCompact);
}

async function main() {
    const inputs = loadInputs();
    const values = await deriveValues(inputs);
    await writeOutputs(values);
}

await main();

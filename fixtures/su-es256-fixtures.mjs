import { base64url } from 'jose';
import {
    compactPayloadEncode,
    createPresentationInternalRepresentation,
    serializeJSON,
    signPayloadSHA256,
    writeJSON,
    writeUtf8,
    writeWrapped,
    writeWrappedJSON
} from './utils.mjs';
import * as crypto from "crypto";
import fs from "node:fs/promises";

import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};
import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with {type: "json"};
import ephemeralPrivateKeyJSON from "./build/es256-ephemeral-private-key.jwk.json" with {type: "json"};
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with {type: "json"};
import issuerHeaderJSON from "./template/su-es256-issuer-header.json" with {type: "json"};
import holderHeaderJSON from "./template/su-es256-holder-header.json" with {type: "json"};

const { encode } = base64url;

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

// storage as we build up
const sigs = [];

issuerHeaderJSON.iek = structuredClone(ephemeralPrivateKeyJSON);
delete issuerHeaderJSON.iek.d;

issuerHeaderJSON.hpk = structuredClone(holderPrivateKeyJSON);
delete issuerHeaderJSON.hpk.d;

await writeJSON("build/su-es256-issuer-header.json", issuerHeaderJSON, {
    pretty: true
});
await writeWrappedJSON(
    "build/su-es256-issuer-header.json.wrapped",
    issuerHeaderJSON,
    { pretty: true }
);

const issuerHeader = Buffer.from(serializeJSON(issuerHeaderJSON), "utf-8");
await writeWrapped(
    "build/su-es256-issuer-header.base64url.wrapped",
    encode(issuerHeader)
);

// encode/sign the issuer header with the stable key
sigs.push(await signPayloadSHA256(issuerHeader, issuerPrivateKey));

for (let payload of payloads) {
    const signature = await signPayloadSHA256(payload, ephemeralPrivateKey);
    sigs.push(signature);
};

await writeJSON("build/su-es256-issuer-proof.json", sigs.map(encode), { pretty: true });
await fs.rm("build/su-es256-issuer-proof.json.wrapped", { force: true });

// Compact Serialization
let compactSerialization = [
    encode(issuerHeader),
    payloads.map(compactPayloadEncode).join("~"),
    sigs.map(encode).join("~")
].join(".");

await writeUtf8("build/su-es256-issuer-compact.jwp", compactSerialization);
await writeWrapped("build/su-es256-issuer-compact.jwp.wrapped", compactSerialization);

holderHeaderJSON.nonce = presentationNonceStr;
const holderHeader = Buffer.from(serializeJSON(holderHeaderJSON), "utf-8");
await writeJSON("build/su-es256-holder-header.json", holderHeaderJSON, {
    pretty: true
});
await writeWrappedJSON(
    "build/su-es256-holder-header.json.wrapped",
    holderHeaderJSON,
    { pretty: true }
);

await writeWrapped(
    "build/su-es256-holder-header.base64url.wrapped",
    encode(holderHeader)
);

payloads[7] = null;
payloads[8] = null;

let internalRepresentation = createPresentationInternalRepresentation(issuerHeader, holderHeader, payloads, sigs );

let signature = await signPayloadSHA256(internalRepresentation, holderPrivateKey);
await writeUtf8("build/su-es256-presentation-pop.base64url", encode(signature));
await fs.rm("build/su-es256-presentation-pop.base64url.wrapped", { force: true });

sigs.splice(6, 2); // remove last two
sigs.push(signature);

await writeJSON("build/su-es256-presentation-proof.json", sigs.map(encode), { pretty: true });
await fs.rm("build/su-es256-presentation-proof.json.wrapped", { force: true });

// Compact Serialization
compactSerialization = [
    encode(holderHeader),
    encode(issuerHeader),
    payloads.map(compactPayloadEncode).join("~"),
    sigs.map(encode).join("~")
].join(".");
await writeUtf8("build/su-es256-presentation-compact.jwp", compactSerialization);
await writeWrapped("build/su-es256-presentation-compact.jwp.wrapped", compactSerialization);

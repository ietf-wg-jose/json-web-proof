import { base64url } from 'jose';
import {
    compactPayloadEncode,
    serializeJSON,
    writeJSON,
    writeWrapped,
    writeWrappedJSON
} from './output-writers.mjs';
import {
    combinedMACRepresentation,
    createPresentationInternalRepresentation,
    payloadMACs,
    payloadSecrets,
    signPayloadSHA256
} from "./crypto-ops.mjs";
import * as crypto from "crypto";

import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};
import issuerPrivateKeyJSON from "./build/es256-issuer-private-key.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/es256-holder-private-key.jwk.json" with {type: "json"};
import holderPublicKeyJSON from "./build/es256-holder-public-key.jwk.json" with {type: "json"};
import issuerNonceStr from "./build/shared-issuer-nonce.base64url.json" with {type: "json"};
import presentationNonceStr from "./build/shared-presentation-nonce.base64url.json" with {type: "json"};
import issuerHeaderJSON from "./template/mac-h256-issuer-header.json" with {type: "json"};
import holderHeaderJSON from "./template/mac-h256-holder-header.json" with {type: "json"};
import holderSharedSecretStr from "./build/mac-h256-holder-shared-secret.base64url.json" with {type: "json"};

const { encode, decode } = base64url;

/// Set up usable data forms from JSON imports

const payloads = payloadsJSON.map((item) => Buffer.from(serializeJSON(item), "utf-8"));
const issuerNonce = decode(issuerNonceStr);
const presentationNonce = decode(presentationNonceStr);
const holderSharedSecret = decode(holderSharedSecretStr);

const issuerPrivateKey = crypto.createPrivateKey({
    key: issuerPrivateKeyJSON, 
    format: "jwk"
});
const holderPrivateKey = crypto.createPrivateKey({
    key: holderPrivateKeyJSON,
    format: "jwk"
});

/// Create Issued JWP

// Add the holder key to the issuer header.
issuerHeaderJSON.hpk = holderPublicKeyJSON;

// Encode/sign the issuer header with the stable key.
const finalIssuerHeader = serializeJSON(issuerHeaderJSON);

await writeJSON("build/mac-h256-issuer-header.json", issuerHeaderJSON, {
    pretty: true
});

// process the issued payloads

const payloadKeys = payloadSecrets('sha256', issuerNonce, payloads.length);
const payloadMacs = payloadMACs("sha256", payloadKeys, payloads);

await writeJSON("build/mac-h256-issuer-payload-keys.json", payloadKeys.map(encode), {
    pretty: true
});
await writeJSON("build/mac-h256-payload-macs.json", payloadMacs.map(encode), {
    pretty: true
});

// merge macs for signing
const combinedMacRepresentation = combinedMACRepresentation(finalIssuerHeader, payloadMacs);

const macsSignature = await signPayloadSHA256(combinedMacRepresentation, issuerPrivateKey);

// Append shared key to raw signature for issuer proof value
const issuedProof = [macsSignature, holderSharedSecret]

await writeWrappedJSON("build/mac-h256-issuer-proof.json.wrapped", issuedProof.map(encode), {
    pretty: true
});

// create issued compact serialization
const serialized = [];
serialized.push(encode(finalIssuerHeader));
serialized.push(payloads.map(compactPayloadEncode).join('~'));
serialized.push(issuedProof.map(encode).join("~"));
const issuerCompactOutput = serialized.join('.');

await writeWrapped("build/mac-h256-issuer-compact.jwp.wrapped", issuerCompactOutput);

/// Create JWP Presentation

// Add a nonce to the holder header.
holderHeaderJSON.nonce = encode(presentationNonce);
const finalHolderHeader = Buffer.from(serializeJSON(holderHeaderJSON), "utf-8");

await writeWrappedJSON(
    "build/mac-h256-holder-header.json.wrapped",
    holderHeaderJSON,
    { pretty: true }
);

// build presentation proof from issuer sig, presentation sig, then mac-or-key
let pres_final = [macsSignature];

const redactedPayloads = [4, 5, 6];
for (let i = 0 ; i < payloads.length; i++ ) {
    // redact payloads
    const redacted = redactedPayloads.includes(i);
    if (redacted) {
        payloads[i] = null;
    }

    // append key for disclosed payloads, mac for redacted payloads
    if (redacted) {
        pres_final.push(payloadMacs[i]);
    } else {
        pres_final.push(payloadKeys[i]);
    }
}

let presentationInternalRepresenation = createPresentationInternalRepresentation(
    finalIssuerHeader,
    finalHolderHeader,
    payloads,
    pres_final);

    // Sign the holder header with the holder key
const presentationHolderSignature = await signPayloadSHA256(presentationInternalRepresenation, holderPrivateKey);
pres_final.push(presentationHolderSignature);


await writeWrappedJSON("build/mac-h256-presentation-proof.json.wrapped", pres_final.map(encode), {
    pretty: true
});

// create issued compact serialization
const serialized2 = [];
serialized2.push(encode(finalHolderHeader));
serialized2.push(encode(finalIssuerHeader));
serialized2.push(payloads.map(compactPayloadEncode).join('~'));
serialized2.push(pres_final.map(encode).join('~'));
const presentedCompactOutput = serialized2.join('.');

await writeWrapped("build/mac-h256-presentation-compact.jwp.wrapped", presentedCompactOutput);

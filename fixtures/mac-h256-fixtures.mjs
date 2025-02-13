import { base64url } from 'jose';
import { GeneralSign } from 'jose';
import { lineWrap, compactPayloadEncode, jsonPayloadEncode, signPayloadSHA256 } from './utils.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";

import payloadsJSON from "./template/jpt-issuer-payloads.json" with {type: "json"};
import issuerPrivateKeyJSON from "./build/issuer-private-key-es256.jwk.json" with {type: "json"};
import holderPrivateKeyJSON from "./build/holder-private-key-es256.jwk.json" with {type: "json"};
import holderPublicKeyJSON from "./build/holder-public-key-es256.jwk.json" with {type: "json"};
import issuerNonceStr from "./build/issuer-nonce.json" with {type: "json"};
import presentationNonceStr from "./build/presentation-nonce.json" with {type: "json"};
import issuerProtectedHeaderJSON from "./template/mac-h256-issuer-protected-header.json" with {type: "json"};
import holderProtectedHeaderJSON from "./template/mac-h256-holder-protected-header.json" with {type: "json"};
import holderSharedSecretStr from "./build/mac-h256-holder-shared-secret.json" with {type: "json"};

const { encode, decode } = base64url;

/// Set up usable data forms from JSON imports

const payloads = payloadsJSON.map((item) => Buffer.from(JSON.stringify(item), "UTF-8"));
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

// Modify the issuer protected header by adding the Holder's public key
issuerProtectedHeaderJSON.presentation_key = holderPublicKeyJSON;

// encode/sign the issuer protected header w/ the stable key
const finalIssuerProtectedHeader = JSON.stringify(issuerProtectedHeaderJSON);

await fs.writeFile("build/mac-h256-issuer-protected-header.json", lineWrap(JSON.stringify(issuerProtectedHeaderJSON, 0, 2)));

let issuerHeaderMac = crypto.createHmac('sha256', 'issuer_header').update(finalIssuerProtectedHeader).digest();

await fs.writeFile("build/mac-h256-issuer-protected-header-mac.txt", lineWrap(encode(issuerHeaderMac)));

// process the issued payloads

let payloadKeys = []; // Buffer[]
let payloadMacs = [] // Buffer[]

for(let i=0; i<payloadsJSON.length; i++)
{
    // generate a unique payload key per numbered slot, based on knowledge of the 
    let payloadKey = crypto.createHmac('sha256', issuerNonce).update("payload_").update(String(i)).digest();
    payloadKeys.push(payloadKey);

    let payload = payloads[i];

    // create a mac based on the synthesized payload key and the encoded payload
    let mac = crypto.createHmac('sha256', payloadKey).update(payload).digest()
    payloadMacs.push(mac);
}

await fs.writeFile("build/mac-h256-issuer-derived-payload-keys.json", JSON.stringify(payloadKeys.map(encode), 0, 2));
await fs.writeFile("build/mac-h256-payload-macs.json", JSON.stringify(payloadMacs.map(encode), 0, 2));

// merge macs for signing

const combinedMacs = payloadMacs.reduce(
    (previousValue, currentValue, currentIndex, array) => {
        return Buffer.concat([previousValue, currentValue])
    },
    issuerHeaderMac
);

const macsSignature = await signPayloadSHA256(combinedMacs, issuerPrivateKey);

// Append shared key to raw signature for issuer proof value
const issuedProof = [macsSignature, holderSharedSecret]

await fs.writeFile("build/mac-h256-issued-proof.json.wrapped", lineWrap(JSON.stringify(issuedProof.map(encode), 0, 2)));

// create issued JSON serialization
const finalIssuedJSON = {
    issuer: encode(finalIssuerProtectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: issuedProof.map(encode)
}
const issuerJSONOutput = JSON.stringify(finalIssuedJSON, 0, 2);

// create issued compact serialization
const serialized = [];
serialized.push(encode(finalIssuerProtectedHeader));
serialized.push(payloads.map(compactPayloadEncode).join('~'));
serialized.push(issuedProof.map(encode).join("~"));
const issuerCompactOutput = serialized.join('.');

await fs.writeFile("build/mac-h256-issuer.json.jwp.wrapped", lineWrap(issuerJSONOutput));
await fs.writeFile("build/mac-h256-issuer.compact.jwp.wrapped", lineWrap(issuerCompactOutput));

/// Create JWP Presentation

// Modify the holder protected header by adding a nonce
holderProtectedHeaderJSON.nonce = encode(presentationNonce);
const finalHolderProtectedHeader = Buffer.from(JSON.stringify(holderProtectedHeaderJSON));

await fs.writeFile("build/mac-h256-presentation-protected-header.json.wrapped", lineWrap(JSON.stringify(holderProtectedHeaderJSON, 0, 2)));

// Sign the presentation protected header w/ the holder key
const presentationProtectedHeaderSignature = await signPayloadSHA256(finalHolderProtectedHeader, holderPrivateKey);

// build presentation proof from issuer sig, presentation sig, then mac-or-key
let pres_final = [presentationProtectedHeaderSignature, macsSignature];

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

// await fs.writeFile("build/mac-h256-presentation-disclosures.json.wrapped",
//     lineWrap(JSON.stringify(pres_final.slice(2).map(encode), 0, 2)));

await fs.writeFile("build/mac-h256-presentation-proof.json.wrapped",
    lineWrap(JSON.stringify(pres_final.map(encode), 0, 2)));

// create issued JSON serialization
const finalPresentedJSON = {
    presentation: encode(finalHolderProtectedHeader),
    issuer: encode(finalIssuerProtectedHeader),
    payloads: payloads.map(jsonPayloadEncode),
    proof: pres_final.map(encode)
}
const presentedJSONOutput = JSON.stringify(finalPresentedJSON, 0, 2);

// create issued compact serialization
const serialized2 = [];
serialized2.push(encode(finalHolderProtectedHeader));
serialized2.push(encode(finalIssuerProtectedHeader));
serialized2.push(payloads.map(compactPayloadEncode).join('~'));
serialized2.push(pres_final.map(encode).join('~'));
const presentedCompactOutput = serialized2.join('.');

await fs.writeFile("build/mac-h256-presentation.json.jwp.wrapped",
    lineWrap(presentedJSONOutput));
await fs.writeFile("build/mac-h256-presentation.compact.jwp.wrapped",
    lineWrap(presentedCompactOutput));

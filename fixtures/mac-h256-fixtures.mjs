import { base64url } from 'jose';
import { GeneralSign } from 'jose';
import { lineWrap } from './linewrap.mjs';
import * as fs from "fs/promises";
import * as crypto from "crypto";

import payloadsJSON from "./template/jpt-issuer-payloads.json" assert {type: "json"};
import issuerPrivateKeyJSON from "./build/issuer-private-key-es256.jwk.json" assert {type: "json"};
import holderPrivateKeyJSON from "./build/holder-private-key-es256.jwk.json" assert {type: "json"};
import holderPublicKeyJSON from "./build/holder-public-key-es256.jwk.json" assert {type: "json"};
import issuerNonceStr from "./build/issuer-nonce.json" assert {type: "json"};
import presentationNonceStr from "./build/presentation-nonce.json" assert {type: "json"};
import issuerProtectedHeaderJSON from "./template/mac-h256-issuer-protected-header.json" assert {type: "json"};
import holderProtectedHeaderJSON from "./template/mac-h256-holder-protected-header.json" assert {type: "json"};
import holderSharedSecretStr from "./build/mac-h256-holder-shared-secret.json" assert {type: "json"};

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

/// Internal usage of JWS for individual payloads

async function sign_payload(payload, key){
    const sig = new GeneralSign(decode(payload));
    sig.addSignature(key).setProtectedHeader({'alg':'ES256'});
    const jws = await sig.sign();
    return jws.signatures[0].signature;
}

/// Create Issued JWP

// Modify the issuer protected header by adding the Holder's public key
issuerProtectedHeaderJSON.pjwk = holderPublicKeyJSON;

// encode/sign the issuer protected header w/ the stable key
const finalIssuerProtectedHeader = JSON.stringify(issuerProtectedHeaderJSON);

await fs.writeFile("build/mac-h256-issuer-protected-header.json", lineWrap(JSON.stringify(issuerProtectedHeaderJSON, 0, 2)));

let issuerHeaderMac = crypto.createHmac('sha256', 'issuer_header').update(encode(finalIssuerProtectedHeader)).digest();

await fs.writeFile("build/mac-h256-issuer-protected-header-mac.txt", lineWrap(encode(issuerHeaderMac)));

// process the issued payloads

let payloadKeys = []; // Buffer[]
let encodedPayloads = [] // Base64URL String[]
let payloadMacs = [] // Buffer[]

for(let i=0; i<payloadsJSON.length; i++)
{
    // generate a unique payload key per numbered slot, based on knowledge of the 
    let payloadKey = crypto.createHmac('sha256', issuerNonce).update("payload_").update(String(i)).digest();
    payloadKeys.push(payloadKey);

    // encode/hash each payload
    let payload = JSON.stringify(payloadsJSON[i]);
    let encoded = encode(payload);
    encodedPayloads.push(encoded);

    // create a mac based on the synthesized payload key and the encoded payload
    let mac = crypto.createHmac('sha256', payloadKey).update(encoded).digest()
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

const macsSignature = decode(await sign_payload(combinedMacs, issuerPrivateKey));

// Append shared key to raw signature for issuer proof value
const issuedProof = Buffer.concat([macsSignature, holderSharedSecret]);

await fs.writeFile("build/mac-h256-issued-proof.txt.wrapped", lineWrap(encode(issuedProof)));

// create issued JSON serialization
const finalIssuedJSON = {
    issuer: encode(finalIssuerProtectedHeader),
    payloads: encodedPayloads,
    proof: encode(issuedProof)
}
const issuerJSONOutput = JSON.stringify(finalIssuedJSON, 0, 2);

// create issued compact serialization
const serialized = [];
serialized.push(encode(finalIssuerProtectedHeader));
serialized.push(encodedPayloads.join('~'));
serialized.push(encode(issuedProof));
const issuerCompactOutput = serialized.join('.');

await fs.writeFile("build/mac-h256-issuer.json.jwp.wrapped", lineWrap(issuerJSONOutput));
await fs.writeFile("build/mac-h256-issuer.compact.jwp.wrapped", lineWrap(issuerCompactOutput));

/// Create JWP Presentation

// Modify the holder protected header by adding a nonce
holderProtectedHeaderJSON.nonce = encode(presentationNonce);
const finalHolderProtectedHeader = JSON.stringify(holderProtectedHeaderJSON);

await fs.writeFile("build/mac-h256-presentation-protected-header.json.wrapped", lineWrap(JSON.stringify(holderProtectedHeaderJSON, 0, 2)));

// Sign the presentation protected header w/ the holder key
const presentationProtectedHeaderSignature = decode(await sign_payload(finalHolderProtectedHeader, holderPrivateKey));

// build presentation proof from issuer sig, presentation sig, then mac-or-key
let pres_final = [presentationProtectedHeaderSignature, macsSignature];

const redactedPayloads = [4, 5, 6];
for (let i = 0 ; i < payloads.length; i++ ) {
    // redact payloads
    const redacted = redactedPayloads.includes(i);
    if (redacted) {
        payloads[i] = null;
        encodedPayloads[i] = "";
    }

    // append key for disclosed payloads, mac for redacted payloads
    if (redacted) {
        pres_final.push(payloadMacs[i]);
    } else {
        pres_final.push(payloadKeys[i]);
    }
}

await fs.writeFile("build/mac-h256-presentation-disclosures.json.wrapped",
    lineWrap(JSON.stringify(pres_final.slice(2).map(encode), 0, 2)));

const presentationProof = Buffer.concat(pres_final);
await fs.writeFile("build/mac-h256-presentation-proof.txt.wrapped",
    lineWrap(encode(presentationProof)));

// create issued JSON serialization
const finalPresentedJSON = {
    presentation: encode(finalHolderProtectedHeader),
    issuer: encode(finalIssuerProtectedHeader),
    payloads: encodedPayloads,
    proof: encode(presentationProof)
}
const presentedJSONOutput = JSON.stringify(finalPresentedJSON, 0, 2);

// create issued compact serialization
const serialized2 = [];
serialized2.push(encode(finalHolderProtectedHeader));
serialized2.push(encode(finalIssuerProtectedHeader));
serialized2.push(encodedPayloads.join('~'));
serialized2.push(encode(presentationProof));
const presentedCompactOutput = serialized2.join('.');

await fs.writeFile("build/mac-h256-presentation.json.jwp.wrapped",
    lineWrap(presentedJSONOutput));
await fs.writeFile("build/mac-h256-presentation.compact.jwp.wrapped",
    lineWrap(presentedCompactOutput));
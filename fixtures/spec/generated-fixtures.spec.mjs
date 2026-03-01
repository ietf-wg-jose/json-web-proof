import fs from "node:fs/promises";
import crypto from "node:crypto";

import { base64url } from "jose";
import { decode as cborDecode, encode as cborEncode } from "cbor2";

import payloadsJSON from "../template/jpt-issuer-payloads.json" with { type: "json" };
import {
    combinedMACRepresentation,
    createPresentationInternalRepresentation,
    payloadMACs,
    payloadSecrets
} from "../utils.mjs";

const encodePayload = (payload) => Buffer.from(JSON.stringify(payload), "utf-8");
const issuerPayloads = payloadsJSON.map(encodePayload);

function inBuild(fileName) {
    return new URL(`../build/${fileName}`, import.meta.url);
}

async function readUtf8(fileName) {
    return fs.readFile(inBuild(fileName), "utf-8");
}

async function readJson(fileName) {
    return JSON.parse(await readUtf8(fileName));
}

function unwrapWrappedCompact(input) {
    return input.replaceAll(/\s+/g, "");
}

function decodePayloadSlot(slot) {
    if (slot === "") {
        return null;
    }
    if (slot === "_") {
        return Buffer.from([]);
    }
    return base64url.decode(slot);
}

function toPublicKey(jwk) {
    return crypto.createPublicKey({ key: jwk, format: "jwk" });
}

function verifySignatureP1363(payload, signature, publicKey) {
    return crypto.verify(
        "SHA256",
        payload,
        {
            dsaEncoding: "ieee-p1363",
            key: publicKey
        },
        signature
    );
}

describe("SU-ES256 generated fixtures", () => {
    it("verify issuer signatures in compact serialization", async () => {
        const compact = await readUtf8("su-es256-issuer.compact.jwp");
        const [protectedB64, payloadPart, signaturePart] = compact.split(".");
        const protectedHeader = base64url.decode(protectedB64);
        const signatures = signaturePart.split("~").map(base64url.decode);
        const payloads = payloadPart.split("~").map(decodePayloadSlot);

        const issuerPublicKey = toPublicKey(await readJson("issuer-public-key-es256.jwk.json"));
        const ephemeralPublicJwk = JSON.parse(Buffer.from(protectedHeader).toString("utf-8")).iek;
        const ephemeralPublicKey = toPublicKey(ephemeralPublicJwk);

        expect(signatures.length).toBe(payloads.length + 1);
        expect(verifySignatureP1363(protectedHeader, signatures[0], issuerPublicKey)).toBeTrue();
        for (let i = 0; i < payloads.length; i += 1) {
            expect(verifySignatureP1363(payloads[i], signatures[i + 1], ephemeralPublicKey)).toBeTrue();
        }
    });

    it("presentation compact structure remains consistent with disclosed proofs", async () => {
        const compact = await readUtf8("su-es256-presentation.compact.jwp");
        const [holderProtectedB64, issuerProtectedB64, payloadPart, proofPart] = compact.split(".");
        const holderProtected = JSON.parse(
            Buffer.from(base64url.decode(holderProtectedB64)).toString("utf-8")
        );
        const issuerProtected = base64url.decode(issuerProtectedB64);
        const payloads = payloadPart.split("~").map(decodePayloadSlot);
        const proofs = proofPart.split("~").map(base64url.decode);

        expect(holderProtected.alg).toBe("SU-ES256");
        expect(holderProtected.aud).toBe("https://recipient.example.com");
        expect(payloads.length).toBe(issuerPayloads.length + 2);
        expect(payloads.at(-1)).toBeNull();
        expect(payloads.at(-2)).toBeNull();
        expect(proofs.length).toBe(7);
        expect(issuerProtected.length).toBeGreaterThan(0);
    });
});

describe("MAC-H256 generated fixtures", () => {
    it("verify issued proof signature and derived key/mac data", async () => {
        const issuerCompact = unwrapWrappedCompact(await readUtf8("mac-h256-issuer.compact.jwp.wrapped"));
        const [, , proofPart] = issuerCompact.split(".");
        const issuerProtectedHeaderObject = await readJson("mac-h256-issuer-protected-header.json");
        const issuerProtectedHeader = JSON.stringify(issuerProtectedHeaderObject);
        const payloads = issuerPayloads;
        const proof = proofPart.split("~").map(base64url.decode);
        const [issuedSignature, sharedSecret] = proof;

        const issuerPublicKey = toPublicKey(await readJson("issuer-public-key-es256.jwk.json"));
        const issuerNonce = base64url.decode(await readJson("issuer-nonce.json"));
        const expectedPayloadKeys = payloadSecrets("sha256", issuerNonce, payloads.length);
        const expectedPayloadMacs = payloadMACs("sha256", expectedPayloadKeys, payloads);
        const combined = combinedMACRepresentation(issuerProtectedHeader, expectedPayloadMacs);
        const holderSharedSecret = base64url.decode(await readJson("mac-h256-holder-shared-secret.json"));

        expect(verifySignatureP1363(combined, issuedSignature, issuerPublicKey)).toBeTrue();
        expect(sharedSecret).toEqual(holderSharedSecret);
    });

    it("verify holder presentation signature", async () => {
        const issuerProtectedHeaderObject = await readJson("mac-h256-issuer-protected-header.json");
        const issuerProtectedHeader = JSON.stringify(issuerProtectedHeaderObject);
        const holderProtectedHeaderObject = JSON.parse(
            unwrapWrappedCompact(await readUtf8("mac-h256-presentation-protected-header.json.wrapped"))
        );
        const holderProtectedHeader = Buffer.from(JSON.stringify(holderProtectedHeaderObject), "utf-8");

        const presentationCompact = unwrapWrappedCompact(
            await readUtf8("mac-h256-presentation.compact.jwp.wrapped")
        );
        const [, , payloadPart, proofPart] = presentationCompact.split(".");
        const payloads = payloadPart.split("~").map(decodePayloadSlot);
        const proof = proofPart.split("~").map(base64url.decode);

        const holderPublicKey = toPublicKey(await readJson("holder-public-key-es256.jwk.json"));
        const holderSignature = proof.at(-1);
        const proofComponents = proof.slice(0, -1);
        const internal = createPresentationInternalRepresentation(
            issuerProtectedHeader,
            holderProtectedHeader,
            payloads,
            proofComponents
        );

        expect(verifySignatureP1363(internal, holderSignature, holderPublicKey)).toBeTrue();
    });
});

describe("CPT generated fixtures", () => {
    it("verify issued-form cbor signatures", async () => {
        const issuedCbor = await fs.readFile(inBuild("cpt-issued-form.cbor"));
        const [issuerProtectedHeader, payloadValues, signatures] = cborDecode(issuedCbor);
        const issuerPublicKey = toPublicKey(await readJson("issuer-public-key-es256.jwk.json"));
        const ephemeralPublicKey = toPublicKey(await readJson("ephemeral-public-key-es256.jwk.json"));

        expect(verifySignatureP1363(issuerProtectedHeader, signatures[0], issuerPublicKey)).toBeTrue();
        for (let i = 0; i < payloadValues.length; i += 1) {
            const payloadOctets = cborEncode(payloadValues[i]);
            expect(verifySignatureP1363(payloadOctets, signatures[i + 1], ephemeralPublicKey)).toBeTrue();
        }
    });

    it("verify holder proof-of-possession against generated pop value", async () => {
        const issuedCbor = await fs.readFile(inBuild("cpt-issued-form.cbor"));
        const [, , issuedProofs] = cborDecode(issuedCbor);
        const presentedCbor = await fs.readFile(inBuild("cpt-presented-form.cbor"));
        const [holderProtectedHeader, issuerProtectedHeaderPresented, payloadValuesPresented, proofValues] =
            cborDecode(presentedCbor);
        const holderPublicKey = toPublicKey(await readJson("holder-public-key-es256.jwk.json"));

        const holderSignature = base64url.decode(
            unwrapWrappedCompact(await readUtf8("cpt-presentation-pop.b64.wrapped"))
        );
        const payloadsForPop = [...payloadValuesPresented];
        payloadsForPop[7] = null;
        payloadsForPop[8] = null;
        const internal = createPresentationInternalRepresentation(
            issuerProtectedHeaderPresented,
            holderProtectedHeader,
            payloadsForPop,
            issuedProofs
        );

        expect(verifySignatureP1363(internal, holderSignature, holderPublicKey)).toBeTrue();
        expect(Buffer.from(proofValues.at(-1))).toEqual(Buffer.from(holderSignature));
    });
});

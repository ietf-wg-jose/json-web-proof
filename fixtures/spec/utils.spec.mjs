import {createPresentationInternalRepresentation, exportForTesting, payloadSecrets, payloadMACs, combinedMACRepresentation } from  "../utils.mjs";

let internalCount = exportForTesting.internalCount;
let internalLengthAndValue = exportForTesting.internalLengthAndValue;
let payloadSecretGenerationValue = exportForTesting.payloadSecretGenerationValue;

describe("internalCount", () => {
    it("should output eight zeroes for a zero input", () => {
        expect(internalCount(0)).toEqual(new Uint8Array(8))
    });
    it("should output seven zeroes and a one for a count of 1", () => {
        let expected = new Uint8Array(8);
        expected[7] = 1
        expect(internalCount(1)).toEqual(expected);
    })
});

describe("internalLengthAndValue", () => {
    it("should output nine butes for a zero length input", () => {
        let expected = new Uint8Array(9);
        expected[0] = 0x5B;
        expect(internalLengthAndValue(new Uint8Array(0))).toEqual(expected);
    })
    it("should output ten bytes for a 1 byte input", () => {
        let expected = new Uint8Array(10);
        expected[0] = 0x5B;
        expected[8] = 1;
        expected[9] = 2;
        expect(internalLengthAndValue(new Uint8Array([2]))).toEqual(expected);
    })
});

describe("createPresentationInternalRepresentation", () => {
    it("should construct an example value", () => {
        const encoder = new TextEncoder();
        const internalRepresentation = 
            createPresentationInternalRepresentation(
                encoder.encode('{"alg":"SU-ES256"}'),
                encoder.encode('{"nonce":"1"}'),
                [null, encoder.encode('"Example"')],
                [new Uint8Array([1]), new Uint8Array([2])]);

        let expected =   
            "845b000000000000000d7b226e6f6e6365223a2231227d5b00000000" +
            "000000127b22616c67223a2253552d4553323536227d9b0000000000" +
            "000002f65b0000000000000009224578616d706c65229b0000000000" +
            "0000025b0000000000000001015b000000000000000102";
        
        expect(Buffer(internalRepresentation).toString("hex")).toEqual(expected);
    });
})

describe("payloadSecretGenerationValue", () => {
    it("should create a proper value per the spec", () => {
        expect(Buffer.from(payloadSecretGenerationValue(1)).toString("hex"))
        .toEqual("82677061796c6f61641b0000000000000001");
    });
})

describe("payloadSecrets", () => {
    it("should generate 2 unique values when requesting 2 payload slot secrets", () => {
        const secretKey = Buffer.from("012345678901234567890123456789012", "hex");
        let secrets = payloadSecrets("sha256", secretKey, 2);
        expect(secrets.length).toBe(2);
        expect(secrets[0]).not.toEqual(secrets[1]);
        expect(secrets[0].length).toBe(32);
    });
});

describe("payloadMACs", () => {
    it("should generate 2 unique values from the same payload", () => {
        const secretKey = Buffer.from("012345678901234567890123456789012", "hex");
        let secrets = payloadSecrets("sha256", secretKey, 2);
        let payload = Buffer.from("true", "utf-8");
        let payloads = [payload, payload];

        let macs = payloadMACs("sha256", secrets, payloads);
        expect(macs.length).toBe(2);
        expect(macs[0]).not.toEqual(macs[1]);
        expect(macs[0].length).toBe(32);
    });
});

describe("combinedMACRepresentation", () => {
    it("should construct an example value", () => {
        const encoder = new TextEncoder();

        const secretKey = Buffer.from("012345678901234567890123456789012", "hex");
        let secrets = payloadSecrets("sha256", secretKey, 2);
        let payloads = [
            Buffer.from('"Example"', "utf-8"),
            Buffer.from("true", "utf-8")
        ];

        let macs = payloadMACs("sha256", secrets, payloads);

        const cmr = 
            combinedMACRepresentation(
                encoder.encode('{"alg":"SU-ES256"}'),
                macs);

        let expected =   
            "825b00000000000000127b22616c67223a2253552d4553323536227d" +
            "9b00000000000000025b000000000000002033cb5b300bb66b7b57da" +
            "3378b30f1d653d8115cc9eb91e99241d0cbebd19f3085b0000000000" +
            "00002095f8c2daaf18b34a2615dcf902abcc7118537a6ce03a908ca6" + 
            "520a14736e0f11";
        
        expect(Buffer(cmr).toString("hex")).toEqual(expected);
    });
})
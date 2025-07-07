import {createPresentationInternalRepresentation, exportForTesting} from  "../utils.mjs";

let internalCount = exportForTesting.internalCount;
let internalLengthAndValue = exportForTesting.internalLengthAndValue;

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

        let expected = "845b000000000000000d7b226e6f6e6365223a2231227d5b00000000000000127b22616c67223a2253552d4553323536227d9b0000000000000002f65b0000000000000009224578616d706c65229b00000000000000025b0000000000000001015b000000000000000102";
        expect(Buffer(internalRepresentation).toString("hex")).toEqual(expected);
    });
})
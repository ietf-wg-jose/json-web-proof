import { base64url } from 'jose';
import * as crypto from 'crypto';
import {promisify} from 'util';

const encode = base64url.encode;

export function lineWrap(str, paddingLength) {
    if (!paddingLength) {
        paddingLength = 0;
    }
    var output = [];
    for (var line of str.split('\n')) {
        if (line.length > 69) {
            while (line.length > 69) {
                output.push(line.substring(0, 69));
                line = Array(paddingLength).join(" ") + line.substring(69);
            }
            output.push(line);
        }
        else {
            output.push(line);
        }
    }
    return output.join("\n");
}

export function compactPayloadEncode(payload) {
    if (payload == null) {
        return "";
    }
    if (payload == "") {
        return "_";
    }
    return encode(payload);
}

export function jsonPayloadEncode(payload) {
    if (payload == null) {
        return null;
    }
    return encode(payload);
}

export async function signPayloadSHA256(payload, key){
    const sig = await promisify(crypto.sign)("SHA256", payload, {
        dsaEncoding: "ieee-p1363", key});
    return sig;
}

// take presentation internal representation and output a binary representation for signing/verifying
//
// Parameters:
// issuedHeaderOctets - uint8array holding the binary data of the JSON or CBOR issuer header
// presentationHeaderOctets - uint8array holding the binary data of the JSON or CBOR presentation header
// array sized to the number of payload slots, with uint8arrays or null entries
// array of uint8array proof components, sans the holder's signature (which this will be used to calculate
//
// Returns: uint8array
//
export function createPresentationInternalRepresentation(
    issuedHeaderOctets, 
    presentationHeaderOctets, 
    payloads, 
    proofComponents) {
        return Buffer.concat([
            Buffer.from("84", "hex"),
            internalBSTRValue(presentationHeaderOctets),
            internalBSTRValue(issuedHeaderOctets),
            Buffer.from("9B", "hex"),
            internalCount(payloads.length),
            Buffer.concat(payloads.map((payload) => 
                payload? internalBSTRValue(payload) : Buffer.from("F6", "hex"))),
            Buffer.from("9B", "hex"),
            internalCount(proofComponents.length),
            Buffer.concat(proofComponents.map(internalBSTRValue))
        ]);
}

// takes a number holding a non-negative integer value and returns a uint8array
function internalCount(count) {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setBigInt64(0, BigInt(count), false);
    return new Uint8Array(buffer);
}

function internalBSTRValue(data) {
    const value = new Uint8Array(data);
    const length = value.byteLength;

    const buffer = new ArrayBuffer(9 + length);

    const view = new DataView(buffer);
    view.setInt8(0, 0x5B);
    view.setBigInt64(1, BigInt(length), false);

    const result = new Uint8Array(buffer);
    result.set(value, 9);
    return result;
}

function payloadSecretGenerationValue(index) {
    return Buffer.concat([
        Buffer.from("82677061796C6F61641B", "hex"),
        internalCount(index)
    ]);
}

export function payloadSecrets(hmacAlg, secretKey, count) {
    return Array.from({length: count }, (v, idx) => idx)
        .map(payloadSecretGenerationValue)
        .map((generator) => {
            const hmac = crypto.createHmac(hmacAlg, secretKey);
            hmac.update(generator);
            return hmac.digest();
        });
}

function zip(...arrays) {
  // Find the length of the shortest array to determine the iteration limit
  const minLength = Math.min(...arrays.map(arr => arr.length));

  // Use Array.from to create an array of the appropriate length
  // and map over its indices to construct the zipped elements.
  return Array.from({ length: minLength }).map((_, i) => {
    // For each index, create a new array containing the element at that index
    // from each of the input arrays.
    return arrays.map(arr => arr[i]);
  });
};


export function payloadMACs(hmacAlg, payloadSecrets, payloads) {
    return zip(payloadSecrets, payloads).map(([secret, payload]) => {
        const hmac = crypto.createHmac(hmacAlg, secret);
        hmac.update(payload);
        return hmac.digest();
    });
}

export function combinedMACRepresentation(issuerProtectedHeaderOctets, payloadMACs) {
    return Buffer.concat([
        Buffer.from("82", "hex"),
        internalBSTRValue(issuerProtectedHeaderOctets),
        Buffer.from("9B", "hex"),
        internalCount(payloadMACs.length),
        Buffer.concat(payloadMACs.map(internalBSTRValue))
    ]);
}

export let exportForTesting = { internalCount, internalLengthAndValue: internalBSTRValue, payloadSecretGenerationValue };
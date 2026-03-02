import { base64url } from 'jose';
import * as crypto from 'crypto';
import fs from "node:fs/promises";

const encode = base64url.encode;
const decode = base64url.decode;

const P256 = {
    p: BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"),
    n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"),
    gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"),
    gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"),
};
P256.a = P256.p - 3n;

function mod(value, m) {
    const result = value % m;
    return result >= 0n ? result : result + m;
}

function modInv(value, m) {
    let a = mod(value, m);
    let b = m;
    let x0 = 1n;
    let x1 = 0n;
    while (b !== 0n) {
        const q = a / b;
        [a, b] = [b, a % b];
        [x0, x1] = [x1, x0 - q * x1];
    }
    if (a !== 1n) {
        throw new Error("modular inverse does not exist");
    }
    return mod(x0, m);
}

function bytesToBigInt(bytes) {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) + BigInt(byte);
    }
    return result;
}

function bigIntToBytes(value, length) {
    const out = new Uint8Array(length);
    let v = value;
    for (let i = length - 1; i >= 0; i -= 1) {
        out[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return out;
}

function pointDouble(point) {
    if (!point) {
        return null;
    }
    const { x, y } = point;
    if (y === 0n) {
        return null;
    }
    const slope = mod(
        (3n * x * x + P256.a) * modInv(2n * y, P256.p),
        P256.p
    );
    const x3 = mod(slope * slope - 2n * x, P256.p);
    const y3 = mod(slope * (x - x3) - y, P256.p);
    return { x: x3, y: y3 };
}

function pointAdd(p1, p2) {
    if (!p1) {
        return p2;
    }
    if (!p2) {
        return p1;
    }
    if (p1.x === p2.x) {
        if (mod(p1.y + p2.y, P256.p) === 0n) {
            return null;
        }
        return pointDouble(p1);
    }
    const slope = mod(
        (p2.y - p1.y) * modInv(p2.x - p1.x, P256.p),
        P256.p
    );
    const x3 = mod(slope * slope - p1.x - p2.x, P256.p);
    const y3 = mod(slope * (p1.x - x3) - p1.y, P256.p);
    return { x: x3, y: y3 };
}

function scalarMultiply(scalar, point) {
    let k = scalar;
    let result = null;
    let addend = point;
    while (k > 0n) {
        if ((k & 1n) === 1n) {
            result = pointAdd(result, addend);
        }
        addend = pointDouble(addend);
        k >>= 1n;
    }
    return result;
}

function hmacSha256(key, data) {
    return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256(data) {
    return crypto.createHash("sha256").update(data).digest();
}

function bits2int(bytes, qlenBits) {
    const value = bytesToBigInt(bytes);
    const excess = BigInt(bytes.length * 8 - qlenBits);
    return excess > 0n ? value >> excess : value;
}

function int2octets(value, length) {
    return bigIntToBytes(value, length);
}

function bits2octets(bytes) {
    const z1 = bits2int(bytes, 256);
    const z2 = mod(z1, P256.n);
    return int2octets(z2, 32);
}

function initDeterministicK(privateScalar, hashedMessage) {
    let v = Buffer.alloc(32, 0x01);
    let k = Buffer.alloc(32, 0x00);
    const x = int2octets(privateScalar, 32);
    const h1 = bits2octets(hashedMessage);
    const bx = Buffer.concat([Buffer.from(x), Buffer.from(h1)]);

    k = hmacSha256(k, Buffer.concat([v, Buffer.from([0x00]), bx]));
    v = hmacSha256(k, v);
    k = hmacSha256(k, Buffer.concat([v, Buffer.from([0x01]), bx]));
    v = hmacSha256(k, v);

    return { k, v };
}

function nextDeterministicK(state) {
    while (true) {
        state.v = hmacSha256(state.k, state.v);
        const candidate = bits2int(state.v, 256);
        if (candidate > 0n && candidate < P256.n) {
            return candidate;
        }
        state.k = hmacSha256(
            state.k,
            Buffer.concat([state.v, Buffer.from([0x00])])
        );
        state.v = hmacSha256(state.k, state.v);
    }
}

function signP256Deterministic(payload, key) {
    const jwk = key.export({ format: "jwk" });
    if (!jwk.d) {
        throw new Error("Expected private EC JWK with d");
    }

    const privateScalar = bytesToBigInt(decode(jwk.d));
    const hash = sha256(payload);
    const hashInt = bits2int(hash, 256);
    const kState = initDeterministicK(privateScalar, hash);
    const generator = { x: P256.gx, y: P256.gy };

    while (true) {
        const k = nextDeterministicK(kState);
        const point = scalarMultiply(k, generator);
        if (!point) {
            continue;
        }
        const r = mod(point.x, P256.n);
        if (r === 0n) {
            continue;
        }
        const kInv = modInv(k, P256.n);
        let s = mod(kInv * (hashInt + r * privateScalar), P256.n);
        if (s === 0n) {
            continue;
        }
        if (s > P256.n / 2n) {
            s = P256.n - s;
        }

        return Buffer.concat([
            Buffer.from(bigIntToBytes(r, 32)),
            Buffer.from(bigIntToBytes(s, 32))
        ]);
    }
}

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

function isPlainObject(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }
    return Object.getPrototypeOf(value) === Object.prototype;
}

export function canonicalizeJSON(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalizeJSON);
    }
    if (isPlainObject(value)) {
        const out = {};
        for (const key of Object.keys(value).sort()) {
            out[key] = canonicalizeJSON(value[key]);
        }
        return out;
    }
    return value;
}

export function serializeJSON(value, { pretty = false } = {}) {
    const canonical = canonicalizeJSON(value);
    return pretty
        ? JSON.stringify(canonical, null, 2)
        : JSON.stringify(canonical);
}

export async function writeUtf8(path, text) {
    await fs.writeFile(path, text, { encoding: "utf-8" });
}

export async function writeWrapped(path, text, paddingLength = 0) {
    await writeUtf8(path, lineWrap(text, paddingLength));
}

export async function writeJSON(path, value, { pretty = false } = {}) {
    await writeUtf8(path, serializeJSON(value, { pretty }));
}

export async function writeWrappedJSON(
    path,
    value,
    { pretty = true, paddingLength = 0 } = {}
) {
    await writeWrapped(path, serializeJSON(value, { pretty }), paddingLength);
}

export async function writeBinary(path, bytes) {
    await fs.writeFile(path, bytes);
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
    return signP256Deterministic(payload, key);
}

// take presentation internal representation and output a binary representation for signing/verifying
//
// Parameters:
// issuerHeaderOctets - uint8array holding the binary data of the JSON or CBOR issuer header
// holderHeaderOctets - uint8array holding the binary data of the JSON or CBOR holder header
// array sized to the number of payload slots, with uint8arrays or null entries
// array of uint8array proof components, sans the holder's signature (which this will be used to calculate
//
// Returns: uint8array
//
export function createPresentationInternalRepresentation(
    issuerHeaderOctets,
    holderHeaderOctets,
    payloads, 
    proofComponents) {
        return Buffer.concat([
            Buffer.from("84", "hex"),
            internalBSTRValue(holderHeaderOctets),
            internalBSTRValue(issuerHeaderOctets),
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

export function combinedMACRepresentation(issuerHeaderOctets, payloadMACs) {
    return Buffer.concat([
        Buffer.from("82", "hex"),
        internalBSTRValue(issuerHeaderOctets),
        Buffer.from("9B", "hex"),
        internalCount(payloadMACs.length),
        Buffer.concat(payloadMACs.map(internalBSTRValue))
    ]);
}

export let exportForTesting = {
    internalCount,
    internalLengthAndValue: internalBSTRValue,
    payloadSecretGenerationValue
};

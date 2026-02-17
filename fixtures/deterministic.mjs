import crypto from "node:crypto";

const P256_CURVE = "prime256v1";
const DOMAIN = "jwp:fixtures:";

function digestSha256(input) {
    return crypto.createHash("sha256").update(input).digest();
}

function deterministicMaterial(label, counter = null) {
    const base = `${DOMAIN}${label}`;
    if (counter === null) {
        return digestSha256(base);
    }

    const counterBytes = Buffer.alloc(4);
    counterBytes.writeUInt32BE(counter, 0);
    return digestSha256(Buffer.concat([
        Buffer.from(base, "utf-8"),
        Buffer.from([0x00]),
        counterBytes
    ]));
}

export function seed32(label) {
    return deterministicMaterial(label);
}

export function bytes32(label) {
    return deterministicMaterial(label);
}

export function validP256PrivateKey(label) {
    const ecdh = crypto.createECDH(P256_CURVE);

    for (let i = 0; i < 1_000_000; i += 1) {
        const candidate = deterministicMaterial(label, i);
        try {
            ecdh.setPrivateKey(candidate);
            return new Uint8Array(candidate);
        } catch {
            // Retry with the next deterministic candidate.
        }
    }

    throw new Error(`Unable to derive a valid P-256 private key for ${label}`);
}

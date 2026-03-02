import { base64url } from "jose";
import fs from "node:fs/promises";

const encode = base64url.encode;

export function lineWrap(str, paddingLength = 0) {
    const output = [];
    for (let line of str.split("\n")) {
        if (line.length > 69) {
            while (line.length > 69) {
                output.push(line.substring(0, 69));
                line = " ".repeat(paddingLength) + line.substring(69);
            }
            output.push(line);
        } else {
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
    if (payload === "") {
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

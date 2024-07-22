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
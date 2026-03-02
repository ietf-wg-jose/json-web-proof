import fs from "node:fs/promises";
import { createHash } from "node:crypto";

function inBuild(fileName) {
    return new URL(`../build/${fileName}`, import.meta.url);
}

async function hashFile(fileName) {
    const bytes = await fs.readFile(inBuild(fileName));
    return createHash("sha256").update(bytes).digest("hex");
}

describe("Golden fixture outputs", () => {
    const golden = new Map([
        ["bbs-issuer-compact.jwp", "0045415a8e1c75238eab540eae366a64ddc23a04d3a2e075c0af747b84ca66d7"],
        ["su-es256-issuer-compact.jwp", "0684f7ab2523c7859c49d3cd51994b1ef69190e7c869fdbaf8f300ed6c26b369"],
        ["mac-h256-issuer-compact.jwp.wrapped", "c103632d97c7b1980567fe35a8b843b142b5d105528f060b6c6e1f673a6bfed3"],
        ["cpt-issuer-form.cbor", "e8f5f8b74e117852996a7f8b5c562b7eeeae29eeb06f21ec02e80225497deb06"],
        ["shared-issuer-nonce.base64url.json", "fdcecc2b1b0953c6cbfc256d6aff68f3f738ffa3a833f2a55b66d5db805080b7"]
    ]);

    for (const [fileName, expectedHash] of golden.entries()) {
        it(`matches ${fileName}`, async () => {
            expect(await hashFile(fileName)).toBe(expectedHash);
        });
    }
});

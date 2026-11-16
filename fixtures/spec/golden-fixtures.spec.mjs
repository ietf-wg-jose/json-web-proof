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
        ["mac-h256-issuer-compact.jwp.wrapped", "3d0dd65c743a5b1ee81e654ff3471ee69ff7959320718fa9135c8ce30c3ae615"],
        ["cpt-issuer-form.cbor", "2cb031e6c62f19a9b16d165cc822fe97861d537efe6592cdc2c47a0f74443c15"],
        ["mac-h256-holder-shared-secret.base64url.json", "fdcecc2b1b0953c6cbfc256d6aff68f3f738ffa3a833f2a55b66d5db805080b7"]
    ]);

    for (const [fileName, expectedHash] of golden.entries()) {
        it(`matches ${fileName}`, async () => {
            expect(await hashFile(fileName)).toBe(expectedHash);
        });
    }
});

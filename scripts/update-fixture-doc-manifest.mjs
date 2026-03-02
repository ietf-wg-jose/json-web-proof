import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "fixtures", "build-doc-manifest.json");

async function collectDraftBuildIncludes() {
    const drafts = [
        "draft-ietf-jose-json-proof-algorithms.md",
        "draft-ietf-jose-json-proof-token.md",
        "draft-ietf-jose-json-web-proof.md"
    ];
    const buildIncludes = new Set();
    const pattern = /\.\/fixtures\/build\/([A-Za-z0-9._-]+)/g;

    for (const draft of drafts) {
        const text = await readFile(path.join(root, draft), "utf-8");
        for (const match of text.matchAll(pattern)) {
            buildIncludes.add(match[1]);
        }
    }
    return [...buildIncludes].sort((a, b) => a.localeCompare(b));
}

async function main() {
    const includes = await collectDraftBuildIncludes();
    await writeFile(manifestPath, `${JSON.stringify(includes, null, 2)}\n`, "utf-8");
    console.log(`Updated fixtures/build-doc-manifest.json (${includes.length} files).`);
}

await main();

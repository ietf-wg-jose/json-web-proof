import { readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, "fixtures", "build");
const manifestPath = path.join(root, "fixtures", "build-manifest.json");

async function main() {
    const files = (await readdir(buildDir)).sort((a, b) => a.localeCompare(b));
    await writeFile(`${manifestPath}`, `${JSON.stringify(files, null, 2)}\n`, "utf-8");
    console.log(`Updated fixtures/build-manifest.json (${files.length} files).`);
}

await main();

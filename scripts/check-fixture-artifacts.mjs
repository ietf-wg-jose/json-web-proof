import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, "fixtures", "build");
const manifestPath = path.join(root, "fixtures", "build-manifest.json");

function toSet(values) {
    return new Set(values);
}

function sorted(values) {
    return [...values].sort((a, b) => a.localeCompare(b));
}

function diff(left, right) {
    const out = [];
    for (const value of left) {
        if (!right.has(value)) {
            out.push(value);
        }
    }
    return sorted(out);
}

async function main() {
    const expected = JSON.parse(await readFile(manifestPath, "utf-8"));
    if (!Array.isArray(expected)) {
        throw new Error("build-manifest.json must contain a JSON array");
    }
    const expectedSet = toSet(expected);
    const actualSet = toSet(await readdir(buildDir));

    const missing = diff(expectedSet, actualSet);
    const extra = diff(actualSet, expectedSet);

    if (missing.length === 0 && extra.length === 0) {
        console.log(`Fixture artifact check passed (${expected.length} files).`);
        return;
    }

    const lines = ["Fixture artifact check failed."];
    if (missing.length > 0) {
        lines.push(`missing (${missing.length}): ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
        lines.push(`extra (${extra.length}): ${extra.join(", ")}`);
    }
    throw new Error(lines.join("\n"));
}

await main();

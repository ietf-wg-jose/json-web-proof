import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: root,
        stdio: "inherit",
        env: process.env
    });
    if (result.status !== 0) {
        throw new Error(`Command failed: ${command} ${args.join(" ")}`);
    }
}

async function hashFile(filePath) {
    const data = await readFile(filePath);
    return createHash("sha256").update(data).digest("hex");
}

async function walkFiles(dirPath) {
    const results = [];
    const entries = await readdir(dirPath, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await walkFiles(fullPath)));
        } else if (entry.isFile()) {
            results.push(fullPath);
        }
    }
    return results;
}

async function collectManifest() {
    const manifest = new Map();
    const buildDir = path.join(root, "fixtures", "build");
    const buildFiles = await walkFiles(buildDir);
    const bbsFileNames = new Set([
        "private-key.jwk",
        "private-key.jwk.wrapped",
        "private-key.cwk",
        "private-key.cwk.edn",
        "public-key.jwk",
        "public-key.jwk.wrapped",
        "public-key.cwk",
        "public-key.cwk.edn",
        "bbs-issuer-proof.base64url",
        "bbs-issuer.compact.jwp",
        "bbs-issuer.compact.jwp.wrapped",
        "bbs-holder-proof.base64url",
        "bbs-holder.compact.jwp",
        "bbs-holder.compact.jwp.wrapped"
    ]);
    for (const filePath of buildFiles) {
        const rel = path.relative(root, filePath);
        if (!bbsFileNames.has(path.basename(filePath))) {
            continue;
        }
        manifest.set(rel, await hashFile(filePath));
    }

    return manifest;
}

function describeDelta(run1, run2) {
    const added = [];
    const removed = [];
    const changed = [];

    for (const [key, hash] of run1.entries()) {
        if (!run2.has(key)) {
            removed.push(key);
            continue;
        }
        if (run2.get(key) !== hash) {
            changed.push(key);
        }
    }

    for (const key of run2.keys()) {
        if (!run1.has(key)) {
            added.push(key);
        }
    }

    return { added, removed, changed };
}

async function runCycle(label) {
    console.log(`\n=== ${label}: clean and rebuild ===`);
    await rm(path.join(root, "fixtures", "build"), { recursive: true, force: true });
    run("make", ["fixtures"]);
    run("make", []);
    return collectManifest();
}

function assertNoDelta(delta) {
    if (delta.added.length === 0 &&
        delta.removed.length === 0 &&
        delta.changed.length === 0) {
        return;
    }

    const lines = [];
    if (delta.added.length > 0) {
        lines.push(`added: ${delta.added.join(", ")}`);
    }
    if (delta.removed.length > 0) {
        lines.push(`removed: ${delta.removed.join(", ")}`);
    }
    if (delta.changed.length > 0) {
        lines.push(`changed: ${delta.changed.join(", ")}`);
    }
    throw new Error(`Reproducibility check failed:\n${lines.join("\n")}`);
}

async function main() {
    const run1 = await runCycle("run1");
    const run2 = await runCycle("run2");
    const delta = describeDelta(run1, run2);
    assertNoDelta(delta);
    console.log("\nReproducibility check passed: run1 and run2 match.");
}

await main();

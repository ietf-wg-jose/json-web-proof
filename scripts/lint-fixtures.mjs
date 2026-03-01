import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanDirs = ["fixtures", "scripts"];

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseImportNames(clause) {
    const names = [];
    const normalized = clause.replace(/\s+/g, " ").trim();

    const namespace = normalized.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespace) {
        names.push(namespace[1]);
    }

    const namedMatch = normalized.match(/\{([^}]*)\}/);
    if (namedMatch) {
        for (const entry of namedMatch[1].split(",").map((item) => item.trim())) {
            if (!entry) {
                continue;
            }
            const alias = entry.match(/^.+\s+as\s+([A-Za-z_$][\w$]*)$/);
            names.push(alias ? alias[1] : entry);
        }
    }

    const defaultMatch = normalized.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/);
    if (defaultMatch) {
        names.push(defaultMatch[1]);
    }

    return names;
}

function collectImports(text) {
    const imports = [];
    const importRegex = /^\s*import\s+([\s\S]*?)\s+from\s+["'][^"']+["'];?/gm;
    for (const match of text.matchAll(importRegex)) {
        const clause = match[1].trim().replace(/\n/g, " ");
        imports.push(...parseImportNames(clause));
    }
    return imports;
}

function findUnusedImports(filePath, text) {
    const imports = collectImports(text);
    const unused = [];

    for (const name of imports) {
        const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, "g");
        const hits = [...text.matchAll(pattern)].length;
        if (hits <= 1) {
            unused.push(name);
        }
    }

    return unused.map((name) => `${filePath}: unused import '${name}'`);
}

async function walk(dirPath) {
    const results = [];
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await walk(fullPath)));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith(".mjs")) {
            results.push(fullPath);
        }
    }
    return results;
}

async function main() {
    const files = (await Promise.all(scanDirs.map((dir) => walk(path.join(root, dir)))))
        .flat()
        .sort((a, b) => a.localeCompare(b));
    const findings = [];

    for (const filePath of files) {
        const text = await readFile(filePath, "utf-8");
        findings.push(...findUnusedImports(path.relative(root, filePath), text));
    }

    if (findings.length > 0) {
        console.error("Fixture lint failed:");
        for (const finding of findings) {
            console.error(`  - ${finding}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log(`Fixture lint passed for ${files.length} files.`);
}

await main();

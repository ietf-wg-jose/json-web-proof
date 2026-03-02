import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanDirs = ["fixtures", "scripts"];
const templateDir = path.join(root, "fixtures", "template");

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

function isPlainObject(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }
    return Object.getPrototypeOf(value) === Object.prototype;
}

function canonicalizeJSON(value) {
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

async function collectTemplateJSONFindings() {
    const findings = [];
    const entries = await readdir(templateDir, { withFileTypes: true });
    const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    for (const name of files) {
        const fullPath = path.join(templateDir, name);
        const relPath = path.relative(root, fullPath);
        const text = await readFile(fullPath, "utf-8");
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            findings.push(`${relPath}: invalid JSON (${error.message})`);
            continue;
        }

        const canonical = JSON.stringify(canonicalizeJSON(parsed), null, 2);
        if (text !== canonical) {
            findings.push(`${relPath}: non-canonical JSON formatting/key order`);
        }
    }
    return findings;
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
    findings.push(...(await collectTemplateJSONFindings()));

    if (findings.length > 0) {
        console.error("Fixture lint failed:");
        for (const finding of findings) {
            console.error(`  - ${finding}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log(`Fixture lint passed for ${files.length} .mjs files and template JSON files.`);
}

await main();

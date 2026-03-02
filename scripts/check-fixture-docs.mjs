import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { base64url } from "jose";
import * as cborEdn from "cbor-edn";
import { decode as cborDecode } from "cbor2";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildManifestPath = path.join(root, "fixtures", "build-manifest.json");
const buildDocManifestPath = path.join(root, "fixtures", "build-doc-manifest.json");
const templateDir = path.join(root, "fixtures", "template");
const buildDir = path.join(root, "fixtures", "build");

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

async function fileExists(fullPath) {
    try {
        await access(fullPath, fsConstants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function loadJsonArray(fullPath, label) {
    const parsed = JSON.parse(await readFile(fullPath, "utf-8"));
    if (!Array.isArray(parsed)) {
        throw new Error(`${label} must contain a JSON array`);
    }
    return parsed;
}

async function collectDraftIncludes() {
    const drafts = [
        "draft-ietf-jose-json-proof-algorithms.md",
        "draft-ietf-jose-json-proof-token.md",
        "draft-ietf-jose-json-web-proof.md"
    ];
    const buildIncludes = new Set();
    const templateIncludes = new Set();
    const pattern = /\.\/fixtures\/(build|template)\/([A-Za-z0-9._-]+)/g;

    for (const draft of drafts) {
        const text = await readFile(path.join(root, draft), "utf-8");
        for (const match of text.matchAll(pattern)) {
            if (match[1] === "build") {
                buildIncludes.add(match[2]);
            } else {
                templateIncludes.add(match[2]);
            }
        }
    }
    return { buildIncludes, templateIncludes };
}

function parseCompactJwp(input, label) {
    const compact = input.trim();
    const parts = compact.split(".");
    if (parts.length !== 3 && parts.length !== 4) {
        throw new Error(`${label}: expected 3 or 4 compact serialization parts`);
    }

    const decodeSlotList = (value) => {
        for (const segment of value.split("~")) {
            if (segment === "" || segment === "_") {
                continue;
            }
            base64url.decode(segment);
        }
    };

    if (parts.length === 3) {
        base64url.decode(parts[0]);
        decodeSlotList(parts[1]);
        decodeSlotList(parts[2]);
        return;
    }

    base64url.decode(parts[0]);
    base64url.decode(parts[1]);
    decodeSlotList(parts[2]);
    decodeSlotList(parts[3]);
}

function normalizeWrappedText(input, fileName) {
    if (!fileName.endsWith(".wrapped")) {
        return input;
    }
    if (fileName.includes(".compact.jwp.wrapped")) {
        return input.replace(/\s+/g, "");
    }
    return input;
}

function parseByExtension(input, fileName) {
    if (fileName.endsWith(".json") || fileName.endsWith(".jwk")) {
        JSON.parse(input);
        return;
    }
    if (fileName.endsWith(".base64url")) {
        base64url.decode(input.trim());
        return;
    }
    if (fileName.endsWith(".jwp")) {
        parseCompactJwp(input, fileName);
        return;
    }
    if (fileName.endsWith(".cbor.hex")) {
        const hex = input.replace(/\s+/g, "");
        if (hex.length % 2 !== 0) {
            throw new Error(`${fileName}: odd-length hex`);
        }
        const cbor = Buffer.from(hex, "hex");
        cborDecode(cbor);
        return;
    }
    if (fileName.endsWith(".edn")) {
        const cbor = cborEdn.parseEDN(input, {
            grammarSource: fileName,
            validateUTF8: true
        });
        cborDecode(cbor);
    }
}

async function parseBuildInclude(buildFile) {
    const directPath = path.join(buildDir, buildFile);
    const wrappedBase = buildFile.endsWith(".wrapped")
        ? buildFile.slice(0, -".wrapped".length)
        : null;
    const preferredPath = wrappedBase ? path.join(buildDir, wrappedBase) : directPath;
    const parseTargetPath = (await fileExists(preferredPath)) ? preferredPath : directPath;
    const parseTargetName = path.basename(parseTargetPath);
    const text = normalizeWrappedText(
        await readFile(parseTargetPath, "utf-8"),
        path.basename(directPath)
    );
    parseByExtension(text, parseTargetName);
}

async function main() {
    const buildManifest = await loadJsonArray(buildManifestPath, "build-manifest.json");
    const buildDocManifest = await loadJsonArray(buildDocManifestPath, "build-doc-manifest.json");
    const buildManifestSet = toSet(buildManifest);
    const buildDocManifestSet = toSet(buildDocManifest);
    const wrappedBuildFiles = toSet(buildManifest.filter((name) => name.endsWith(".wrapped")));
    const { buildIncludes, templateIncludes } = await collectDraftIncludes();

    const findings = [];

    const docManifestMissingInDrafts = diff(buildDocManifestSet, buildIncludes);
    if (docManifestMissingInDrafts.length > 0) {
        findings.push(
            `build-doc-manifest entries not referenced in drafts: ${docManifestMissingInDrafts.join(", ")}`
        );
    }

    const draftBuildIncludesMissingInDocManifest = diff(buildIncludes, buildDocManifestSet);
    if (draftBuildIncludesMissingInDocManifest.length > 0) {
        findings.push(
            `draft build includes missing from build-doc-manifest: ${draftBuildIncludesMissingInDocManifest.join(", ")}`
        );
    }

    const draftBuildIncludesMissingInBuildManifest = diff(buildIncludes, buildManifestSet);
    if (draftBuildIncludesMissingInBuildManifest.length > 0) {
        findings.push(
            `draft build includes missing from build-manifest: ${draftBuildIncludesMissingInBuildManifest.join(", ")}`
        );
    }

    const docManifestMissingInBuildManifest = diff(buildDocManifestSet, buildManifestSet);
    if (docManifestMissingInBuildManifest.length > 0) {
        findings.push(
            `build-doc-manifest entries missing from build-manifest: ${docManifestMissingInBuildManifest.join(", ")}`
        );
    }

    const wrappedMissingInDrafts = diff(wrappedBuildFiles, buildIncludes);
    if (wrappedMissingInDrafts.length > 0) {
        findings.push(
            `wrapped build artifacts not referenced by drafts: ${wrappedMissingInDrafts.join(", ")}`
        );
    }

    for (const buildFile of sorted(buildIncludes)) {
        const exists = await fileExists(path.join(buildDir, buildFile));
        if (!exists) {
            findings.push(`draft references missing build file: ${buildFile}`);
            continue;
        }
        try {
            await parseBuildInclude(buildFile);
        } catch (error) {
            findings.push(`unable to parse draft build include ${buildFile}: ${error.message}`);
        }
    }

    for (const templateFile of sorted(templateIncludes)) {
        const exists = await fileExists(path.join(templateDir, templateFile));
        if (!exists) {
            findings.push(`draft references missing template file: ${templateFile}`);
        }
    }

    if (findings.length > 0) {
        throw new Error(`Fixture doc consistency check failed:\n${findings.join("\n")}`);
    }

    console.log(
        `Fixture doc consistency check passed (${buildIncludes.size} build includes, ` +
        `${templateIncludes.size} template includes).`
    );
}

await main();

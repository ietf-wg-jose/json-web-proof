import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = fileURLToPath(new URL(".", import.meta.url));

const STAGES = [
    {
        name: "shared-seeds",
        scripts: [
            ["shared-nonce-gen.mjs"],
            ["mac-h256-shared-secret-gen.mjs"]
        ]
    },
    {
        name: "bbs",
        scripts: [
            ["bbs-keygen.mjs"],
            ["bbs-fixtures.mjs"]
        ]
    },
    {
        name: "es256-keys",
        scripts: [
            ["es256-keygen.mjs", "issuer"],
            ["es256-keygen.mjs", "holder"],
            ["es256-keygen.mjs", "ephemeral"]
        ]
    },
    {
        name: "su-es256",
        scripts: [
            ["su-es256-jwp-fixtures.mjs"],
            ["su-es256-cpt-fixtures.mjs"]
        ]
    },
    {
        name: "mac-h256",
        scripts: [
            ["mac-h256-fixtures.mjs"]
        ]
    }
];

function runScript(stageName, scriptArgs) {
    return new Promise((resolve, reject) => {
        const [script, ...args] = scriptArgs;
        const cmdArgs = ["--no-warnings", script, ...args];
        const child = spawn("node", cmdArgs, {
            cwd: FIXTURES_DIR,
            stdio: "inherit"
        });

        child.on("error", (error) => {
            reject(new Error(
                `Failed to start stage '${stageName}' script '${script}': ${error.message}`
            ));
        });

        child.on("exit", (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(
                `Fixture stage '${stageName}' failed in script '${script}'` +
                ` (code=${code ?? "null"}, signal=${signal ?? "null"})`
            ));
        });
    });
}

async function main() {
    for (const stage of STAGES) {
        console.log(`[fixtures] stage: ${stage.name}`);
        for (const scriptArgs of stage.scripts) {
            console.log(`[fixtures]   node ${scriptArgs.join(" ")}`);
            await runScript(stage.name, scriptArgs);
        }
    }
    console.log("[fixtures] complete");
}

main().catch((error) => {
    console.error("[fixtures] pipeline failed");
    console.error(error.message);
    process.exit(1);
});

import { Analyzer, AnalyzerResult, Finding } from "../types";
import fs from "fs";
import path from "path";
import { calculateSeverity } from "../utils/severity";

export class RuntimeAnalyzer implements Analyzer {
    name = "Runtime Compatibility Check";
    weight = 2;
    supports: ("node" | "static" | "all")[] = ["node"];

    private MAX_SCORE = 20;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();
        const packageJsonPath = path.join(projectRoot, "package.json");

        let score = 0;
        const findings: Finding[] = [];

        // Check Node engine declaration
        if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

            if (!pkg.engines?.node) {
                score -= 8;

                findings.push({
                    type: "error",
                    message: "Node.js version is not specified in package.json (engines.node missing).",
                    evidence: "package.json does not define engines.node",
                    suggestion: 'Add `"engines": { "node": ">=18.x" }` to package.json to enforce runtime consistency.',
                });
            }
        } else {
            score = 0;

            findings.push({
                type: "error",
                message: "package.json file is missing.",
                suggestion: "Ensure this project is a valid Node.js project with a package.json file.",
            });
        }

        // Check version manager config (.nvmrc / .node-version)

        const hasNodeVersionFile =
            fs.existsSync(path.join(projectRoot, ".nvmrc")) ||
            fs.existsSync(path.join(projectRoot, ".node-version"));

        if (!hasNodeVersionFile) {
            score -= 6;

            findings.push({
                type: "warning",
                message: "No Node version manager file found (.nvmrc or .node-version).",
                suggestion: "Add a .nvmrc or .node-version file to standardize Node.js versions across environments.",
            });
        }

        // Check dependency lockfile
        const lockfiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

        const detectedLockfile = lockfiles.find(file =>
            fs.existsSync(path.join(projectRoot, file))
        );

        if (!detectedLockfile) {
            score -= 6;

            findings.push({
                type: "error",
                message: "No dependency lockfile detected.",
                evidence: "Missing package-lock.json, yarn.lock, or pnpm-lock.yaml",
                suggestion: "Commit a lockfile to ensure deterministic dependency installation across environments.",
            });
        }

        if (score < 0) score = 0;

        return {
            name: this.name,
            success: score === this.MAX_SCORE,
            findings,
            scoreImpact: score,
            maxScore: this.MAX_SCORE,
            severity: calculateSeverity(score, this.MAX_SCORE),
        };
    }
}

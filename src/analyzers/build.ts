import { Analyzer, AnalyzerResult, Finding } from "../types";
import fs from "fs";
import path from "path";
import { execa } from "execa";
import { calculateSeverity } from "../utils/severity";

export class BuildAnalyzer implements Analyzer {
    name = "Build Check";
    weight = 1.5;
    supports: ("node" | "static" | "all")[] = ["node"];

    private MAX_SCORE = 50;
    private BUILD_TIMEOUT_MS = 60_000; // 60s safety timeout

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();
        const packageJsonPath = path.join(projectRoot, "package.json");
        const tsconfigPath = path.join(projectRoot, "tsconfig.json");

        let score = this.MAX_SCORE;
        const findings: Finding[] = [];

        // 1. Ensure package.json exists
        if (!fs.existsSync(packageJsonPath)) {
            return {
                name: this.name,
                success: false,
                findings: [
                    {
                        type: "error",
                        message: "package.json file is missing.",
                        suggestion:
                            "Ensure this is a valid Node.js project with a package.json file.",
                    },
                ],
                scoreImpact: 0,
                maxScore: this.MAX_SCORE,
                severity: "critical",
            };
        }

        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const hasBuildScript = Boolean(pkg.scripts?.build);
        const usesTypeScript = fs.existsSync(tsconfigPath);

        // 2. TypeScript but no build script
        if (usesTypeScript && !hasBuildScript) {
            score = 10;

            findings.push({
                type: "error",
                message:
                    "TypeScript project detected but no build script found in package.json.",
                evidence: "tsconfig.json exists but scripts.build is undefined",
                suggestion:
                    'Add a build script (e.g., `"build": "tsc"`) to compile TypeScript before deployment.',
            });

            return {
                name: this.name,
                success: false,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: calculateSeverity(score, this.MAX_SCORE),
            };
        }

        // 3. No build script at all
        if (!hasBuildScript) {
             findings.push({
                type: "warning",
                message: "No build script found in package.json.",
                suggestion:
                    "Consider defining a build step to ensure consistent production builds.",
            });

            return {
                name: this.name,
                success: true,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: calculateSeverity(score, this.MAX_SCORE),
            };
        }

        // Execute build safely
        try {
            const { stdout, stderr } = await execa("npm", ["run", "build"], {
                cwd: projectRoot,
                timeout: this.BUILD_TIMEOUT_MS,
            });

            const combineOutput = `${stdout}\n${stderr}`;
            const warningCount = (combineOutput.match(/warning/gi) || []).length;

            if (warningCount > 0) {
                const deduction = Math.min(warningCount * 2, 20);
                score -= deduction;

                findings.push({
                    type: "warning",
                    message: `${warningCount} build warning(s) detected.`,
                    suggestion: "Resolve build warnings to improve production stability and reduce hidden runtime issues."
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

        } catch (err: any) {
            score = 0;

            findings.push({
                type: "error",
                message: "Build execution failed.",
                evidence: err?.stderr || err?.message,
                suggestion: "Fix build errors before deployment. Ensure the project builds successfully in a clean environment."
            });

            return {
                name: this.name,
                success: false,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: "critical"
            };
        }
    }
}

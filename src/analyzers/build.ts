import { Analyzer, AnalyzerResult } from "../types";
import { execa } from "execa";
import fs from "fs";
import path from "path";

export class BuildAnalyzer implements Analyzer {
    name = "Build Check";
    private MAX_SCORE = 50;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();
        const packageJsonPath = path.join(projectRoot, "package.json");
        const tsconfigPath = path.join(projectRoot, "tsconfig.json");

        // === Must have package.json ===
        if (!fs.existsSync(packageJsonPath)) {
            return {
                name: this.name,
                success: false,
                warnings: [],
                errors: ["No package.json found in this directory."],
                scoreImpact: 0,
                severity: "critical"
            };
        }

        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8")
        );

        const hasBuildScript = Boolean(packageJson.scripts?.build);
        const usesTypeScript = fs.existsSync(tsconfigPath);

        // === CASE 1: TypeScript project without build script ===
        if (usesTypeScript && !hasBuildScript) {
            return {
                name: this.name,
                success: false,
                warnings: [],
                errors: ["TypeScript project detected but no 'build' script found."],
                scoreImpact: 10,
                severity: "high"
            };
        }

        // === CASE 2: Pure JS project without build is acceptable ===
        if (!usesTypeScript && !hasBuildScript) {
            return {
                name: this.name,
                success: true,
                warnings: [
                    "No build script found (acceptable for pure JavaScript projects)."
                ],
                errors: [],
                scoreImpact: this.MAX_SCORE,
                severity: "healthy"
            };
        }

        // === CASE 3: Build script exists → execute it ===
        try {
            const { stdout } = await execa("npm", ["run", "build"], {
                stdio: "pipe"
            });

            const warningCount = (stdout.match(/warning/gi) || []).length;

            let score = this.MAX_SCORE - warningCount * 2;
            if (score < 0) score = 0;

            let severity: AnalyzerResult["severity"] = "healthy";
            if (warningCount > 5) severity = "medium";
            else if (warningCount > 0) severity = "low";

            return {
                name: this.name,
                success: true,
                warnings:
                    warningCount > 0
                        ? [`${warningCount} build warnings detected.`]
                        : [],
                errors: [],
                scoreImpact: score,
                severity
            };
        } catch (error: any) {
            const errorOutput = error.stderr || error.message || "";
            const errorLines = errorOutput.split("\n").filter(Boolean).length;

            let score = this.MAX_SCORE - errorLines * 5;
            if (score < 0) score = 0;

            return {
                name: this.name,
                success: false,
                warnings: [],
                errors: [errorOutput],
                scoreImpact: score,
                severity: "critical"
            };
        }
    }
}

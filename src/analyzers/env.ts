import { Analyzer, AnalyzerResult } from "../types";
import fs from "fs";
import path from "path";
import { globSync } from "glob";

export class EnvAnalyzer implements Analyzer {
    name = "Environment Variables Check";
    private MAX_SCORE = 30;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();

        // Scan project files for environment variable usage
        const files = globSync("src/**/*.{ts,js,tsx,jsx}", {
            cwd: projectRoot,
            ignore: ["node_modules/**", "dist/**"]
        });

        let usesEnvVariables = false;

        for (const file of files) {
            const content = fs.readFileSync(
                path.join(projectRoot, file),
                "utf-8"
            );

            if (content.includes("process.env")) {
                usesEnvVariables = true;
                break;
            }
        }

        // If project does NOT use environment variables, don't penalize
        if (!usesEnvVariables) {
            return {
                name: this.name,
                success: true,
                warnings: ["No environment variables detected (not required)."],
                errors: [],
                scoreImpact: this.MAX_SCORE,
                severity: "healthy"
            };
        }

        // If env variables ARE used, enforce checks
        const envPath = path.join(projectRoot, ".env");
        const examplePath = path.join(projectRoot, ".env.example");

        let score = this.MAX_SCORE;
        const warnings: string[] = [];

        if (!fs.existsSync(envPath)) {
            score -= 15;
            warnings.push(".env file is missing.");
        }

        if (!fs.existsSync(examplePath)) {
            score -= 10;
            warnings.push(".env.example file is missing.");
        }

        if (score < 0) score = 0;

        let severity: AnalyzerResult["severity"] = "healthy";

        if (score === this.MAX_SCORE) severity = "healthy";
        else if (score >= 20) severity = "medium";
        else severity = "high";

        return {
            name: this.name,
            success: score === this.MAX_SCORE,
            warnings,
            errors: [],
            scoreImpact: score,
            severity
        };
    }
}

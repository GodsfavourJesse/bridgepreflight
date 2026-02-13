import { Analyzer, AnalyzerResult } from "../types";
import fs from "fs";
import path from "path";

export class EnvAnalyzer implements Analyzer {
    name = "Environment Variables Check";
    private MAX_SCORE = 30;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();

        const envPath = path.join(projectRoot, ".env");
        const examplePath = path.join(projectRoot, ".env.example");

        let score = this.MAX_SCORE;
        const warnings: string[] = [];
        const errors: string[] = [];

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

        if (score === this.MAX_SCORE) severity =  "healthy";
        else if (score >= 20) severity = "medium";
        else severity = "high";

        return {
            name: this.name,
            success: score === this.MAX_SCORE,
            warnings,
            errors,
            scoreImpact: score,
            severity
        };
    }
}
import { Analyzer, AnalyzerResult } from "../types";
import fs from "fs";
import path from "path";
import { globSync} from "glob";

export class NetworkAnalyzer implements Analyzer {
    name = "Localhost Leak Check";
    private MAX_SCORE = 20;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();
        const files = globSync("**/*.{ts,js,tsx,jsx}", {
            cwd: projectRoot,
            ignore: ["node_modules/**", "dist/**"]
        });

        let score = this.MAX_SCORE;
        const warnings: string[] = [];

        let leakCount = 0;

        for (const file of files) {
            const content = fs.readFileSync(
                path.join(projectRoot, file), 
                "utf-8"
            );

            if (content.includes("localhost") || content.includes("127.0.0.1")) {
                leakCount++;
            }
        }

        if (leakCount > 0) {
            score -= leakCount * 2;
            warnings.push(`${leakCount} potential localhost references found.`);
        }

        if (score < 0) score = 0;

        let severity: AnalyzerResult["severity"] = "healthy";

        if (leakCount > 5) severity = "high";
        else if (leakCount > 0) severity = "medium";

        return {
            name: this.name,
            success: leakCount === 0,
            warnings,
            errors: [],
            scoreImpact: score,
            severity
        };
    }
}
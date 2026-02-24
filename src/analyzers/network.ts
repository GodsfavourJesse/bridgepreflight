import { Analyzer, AnalyzerResult, Finding } from "../types";
import fs from "fs";
import path from "path";
import { globSync } from "glob";
import { calculateSeverity } from "../utils/severity";

export class NetworkAnalyzer implements Analyzer {
    name = "Localhost Leak Check";
    weight = 1.2;
    supports: ("node" | "static" | "all")[] = ["all"];

    private MAX_SCORE = 20;
    private MAX_FILES_TO_SCAN = 500;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();

        const baseDir = fs.existsSync(path.join(projectRoot, "src"))
            ? path.join(projectRoot, "src")
            : projectRoot;

        const files = globSync("**/*.{ts,js,tsx,jsx}", {
            cwd: baseDir,
            ignore: ["node_modules/**", "dist/**"],
            nodir: true
        });

        let score = this.MAX_SCORE;
        const findings: Finding[] = [];

        const leakFiles: string[] = [];

        for (const file of files.slice(0, this.MAX_FILES_TO_SCAN)) {
            const fullPath = path.join(baseDir, file);
            const content = fs.readFileSync(fullPath, "utf-8");

            // Basic but effective detection
            if (
                content.includes("localhost") || 
                content.includes("127.0.0.1")
            ) {
                leakFiles.push(file);
            }
        }

        const leakCount = leakFiles.length;

        if (leakCount > 0) {
            // Deduct up to a max of 12 points (prevent total collapse)
            const deduction = Math.min(leakCount * 2, 12);
            score -= deduction;

            findings.push({
                type: leakCount > 5 ? "error" : "warning",
                message: `${leakCount} hardcoded localhost reference(s) detected.`,
                evidence: `Examples: ${leakFiles.slice(0, 5).join(", ")}`,
                suggestion:
                    "Replace hardcoded localhost or 127.0.0.1 URLs with environment-based configuration (e.g., process.env.API_BASE_URL).",
            });
        }


        if (score < 0) score = 0;

        return {
            name: this.name,
            success: leakCount === 0,
            findings,
            scoreImpact: score,
            maxScore: this.MAX_SCORE,
            severity: calculateSeverity(score, this.MAX_SCORE)
        };
    }
}

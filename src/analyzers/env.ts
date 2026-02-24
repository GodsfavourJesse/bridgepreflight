import { Analyzer, AnalyzerResult, Finding } from "../types";
import fs from "fs";
import path from "path";
import { globSync } from "glob";
import { calculateSeverity } from "../utils/severity";

export class EnvAnalyzer implements Analyzer {
    name = "Environment Variables Check";
    weight = 1;
    supports: ("node" | "static" | "all")[] = ["all"];
    private MAX_SCORE = 30;

    async run(): Promise<AnalyzerResult> {
        const projectRoot = process.cwd();

        const baseDir = fs.existsSync(path.join(projectRoot, "src"))
            ? path.join(projectRoot, "src")
            : projectRoot;

        const files = globSync("**/*.{ts,js,tsx,jsx,html,css}", {
            cwd: baseDir,
            ignore: ["node_modules/**", "dist/**"],
            nodir: true
        });

        let score = this.MAX_SCORE;
        const findings: Finding[] = [];
        const envUsageFiles: string[] = [];

        // Scan up to 300 files for performance safety
        for (const file of files.slice(0, 300)) {
            const content = fs.readFileSync(path.join(baseDir, file), "utf-8");
            if (content.includes("process.env")) envUsageFiles.push(file);
        }

        const usesEnv = envUsageFiles.length > 0;

        // Check for any environment file variants
        const envFiles = [
            ".env",
            ".env.local",
            ".env.development",
            ".env.production"
        ];
        const existingEnvFile = envFiles.find((f) =>
            fs.existsSync(path.join(projectRoot, f))
        );

        // Detect static HTML/CSS/JS projects
        const isStaticProject = files.every((f) => /\.(html|css|js)$/.test(f));

        // ----------- 1. Static projects with no env usage -----------
        if (isStaticProject && !usesEnv) {
            findings.push({
                type: "info",
                message: "No .env file and no process.env usage detected.",
                suggestion: "If your project will need API calls or secrets in the future, consider adding a .env file."
            });
        } else {
            // ----------- 2. Process.env used but no env file -----------
            if (usesEnv && !existingEnvFile) {
                score -= 20;
                findings.push({
                    type: "error",
                    message: ".env file is missing but process.env usage was detected.",
                    evidence: `process.env found in ${envUsageFiles.length} file(s). Example: ${envUsageFiles.slice(0, 3).join(", ")}`,
                    suggestion: "Create a .env file (or .env.local/.env.development) for local development or configure environment variables in your deployment platform."
                });
            }
        }

        // ----------- 3. Recommend .env.example even if env file exists -----------
        if (!fs.existsSync(path.join(projectRoot, ".env.example"))) {
            findings.push({
                type: "info",
                message: ".env.example file is missing.",
                suggestion: "Add a .env.example file to document required environment variables for your team and CI/CD environments."
            });
        }

        if (score < 0) score = 0;

        return {
            name: this.name,
            success: score === this.MAX_SCORE,
            findings,
            scoreImpact: score,
            maxScore: this.MAX_SCORE,
            severity: calculateSeverity(score, this.MAX_SCORE)
        };
    }
}
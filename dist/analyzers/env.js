"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
class EnvAnalyzer {
    constructor() {
        this.name = "Environment Variables Check";
        this.MAX_SCORE = 30;
    }
    async run() {
        const projectRoot = process.cwd();
        // Scan project files for environment variable usage
        const files = (0, glob_1.globSync)("src/**/*.{ts,js,tsx,jsx}", {
            cwd: projectRoot,
            ignore: ["node_modules/**", "dist/**"]
        });
        let usesEnvVariables = false;
        for (const file of files) {
            const content = fs_1.default.readFileSync(path_1.default.join(projectRoot, file), "utf-8");
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
        const envPath = path_1.default.join(projectRoot, ".env");
        const examplePath = path_1.default.join(projectRoot, ".env.example");
        let score = this.MAX_SCORE;
        const warnings = [];
        if (!fs_1.default.existsSync(envPath)) {
            score -= 15;
            warnings.push(".env file is missing.");
        }
        if (!fs_1.default.existsSync(examplePath)) {
            score -= 10;
            warnings.push(".env.example file is missing.");
        }
        if (score < 0)
            score = 0;
        let severity = "healthy";
        if (score === this.MAX_SCORE)
            severity = "healthy";
        else if (score >= 20)
            severity = "medium";
        else
            severity = "high";
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
exports.EnvAnalyzer = EnvAnalyzer;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class EnvAnalyzer {
    constructor() {
        this.name = "Environment Variables Check";
        this.MAX_SCORE = 30;
    }
    async run() {
        const projectRoot = process.cwd();
        const envPath = path_1.default.join(projectRoot, ".env");
        const examplePath = path_1.default.join(projectRoot, ".env.example");
        let score = this.MAX_SCORE;
        const warnings = [];
        const errors = [];
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
            errors,
            scoreImpact: score,
            severity
        };
    }
}
exports.EnvAnalyzer = EnvAnalyzer;

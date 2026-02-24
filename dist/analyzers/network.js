"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const severity_1 = require("../utils/severity");
class NetworkAnalyzer {
    constructor() {
        this.name = "Localhost Leak Check";
        this.weight = 1.2;
        this.supports = ["all"];
        this.MAX_SCORE = 20;
        this.MAX_FILES_TO_SCAN = 500;
    }
    async run() {
        const projectRoot = process.cwd();
        const baseDir = fs_1.default.existsSync(path_1.default.join(projectRoot, "src"))
            ? path_1.default.join(projectRoot, "src")
            : projectRoot;
        const files = (0, glob_1.globSync)("**/*.{ts,js,tsx,jsx}", {
            cwd: baseDir,
            ignore: ["node_modules/**", "dist/**"],
            nodir: true
        });
        let score = this.MAX_SCORE;
        const findings = [];
        const leakFiles = [];
        for (const file of files.slice(0, this.MAX_FILES_TO_SCAN)) {
            const fullPath = path_1.default.join(baseDir, file);
            const content = fs_1.default.readFileSync(fullPath, "utf-8");
            // Basic but effective detection
            if (content.includes("localhost") ||
                content.includes("127.0.0.1")) {
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
                suggestion: "Replace hardcoded localhost or 127.0.0.1 URLs with environment-based configuration (e.g., process.env.API_BASE_URL).",
            });
        }
        if (score < 0)
            score = 0;
        return {
            name: this.name,
            success: leakCount === 0,
            findings,
            scoreImpact: score,
            maxScore: this.MAX_SCORE,
            severity: (0, severity_1.calculateSeverity)(score, this.MAX_SCORE)
        };
    }
}
exports.NetworkAnalyzer = NetworkAnalyzer;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
class NetworkAnalyzer {
    constructor() {
        this.name = "Localhost Leak Check";
        this.MAX_SCORE = 20;
    }
    async run() {
        const projectRoot = process.cwd();
        const files = (0, glob_1.globSync)("**/*.{ts,js,tsx,jsx}", {
            cwd: projectRoot,
            ignore: ["node_modules/**", "dist/**"]
        });
        let score = this.MAX_SCORE;
        const warnings = [];
        let leakCount = 0;
        for (const file of files) {
            const content = fs_1.default.readFileSync(path_1.default.join(projectRoot, file), "utf-8");
            if (content.includes("localhost") || content.includes("127.0.0.1")) {
                leakCount++;
            }
        }
        if (leakCount > 0) {
            score -= leakCount * 2;
            warnings.push(`${leakCount} potential localhost references found.`);
        }
        if (score < 0)
            score = 0;
        let severity = "healthy";
        if (leakCount > 5)
            severity = "high";
        else if (leakCount > 0)
            severity = "medium";
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
exports.NetworkAnalyzer = NetworkAnalyzer;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildAnalyzer = void 0;
const execa_1 = require("execa");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class BuildAnalyzer {
    constructor() {
        this.name = "Build Check";
        this.MAX_SCORE = 50;
    }
    async run() {
        const projectRoot = process.cwd();
        const packageJsonPath = path_1.default.join(projectRoot, "package.json");
        if (!fs_1.default.existsSync(packageJsonPath)) {
            return {
                name: this.name,
                success: false,
                warnings: [],
                errors: ["No package.json found in this directory."],
                scoreImpact: 0,
                severity: "critical"
            };
        }
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf-8"));
        if (!packageJson.scripts || !packageJson.scripts.build) {
            return {
                name: this.name,
                success: false,
                warnings: [],
                errors: ["No 'build' script found in package.json."],
                scoreImpact: 10, // partial credit for valid project structure
                severity: "high"
            };
        }
        try {
            const { stdout } = await (0, execa_1.execa)("npm", ["run", "build"], {
                stdio: "pipe"
            });
            // Count warnings
            const warningCount = (stdout.match(/warning/gi) || []).length;
            let score = this.MAX_SCORE - warningCount * 2;
            if (score < 0)
                score = 0;
            let severity = "healthy";
            if (warningCount > 5)
                severity = "medium";
            else if (warningCount > 0)
                severity = "low";
            return {
                name: this.name,
                success: true,
                warnings: warningCount > 0
                    ? [`${warningCount} build warnings detected.`]
                    : [],
                errors: [],
                scoreImpact: score,
                severity
            };
        }
        catch (error) {
            const errorOutput = error.stderr || error.message || "";
            const errorLines = errorOutput.split("\n").filter(Boolean).length;
            let score = this.MAX_SCORE - errorLines * 5;
            if (score < 0)
                score = 0;
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
exports.BuildAnalyzer = BuildAnalyzer;

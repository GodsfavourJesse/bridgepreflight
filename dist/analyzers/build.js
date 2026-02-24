"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const execa_1 = require("execa");
const severity_1 = require("../utils/severity");
class BuildAnalyzer {
    constructor() {
        this.name = "Build Check";
        this.weight = 1.5;
        this.supports = ["node"];
        this.MAX_SCORE = 50;
        this.BUILD_TIMEOUT_MS = 60000; // 60s safety timeout
    }
    async run() {
        const projectRoot = process.cwd();
        const packageJsonPath = path_1.default.join(projectRoot, "package.json");
        const tsconfigPath = path_1.default.join(projectRoot, "tsconfig.json");
        let score = this.MAX_SCORE;
        const findings = [];
        // 1. Ensure package.json exists
        if (!fs_1.default.existsSync(packageJsonPath)) {
            return {
                name: this.name,
                success: false,
                findings: [
                    {
                        type: "error",
                        message: "package.json file is missing.",
                        suggestion: "Ensure this is a valid Node.js project with a package.json file.",
                    },
                ],
                scoreImpact: 0,
                maxScore: this.MAX_SCORE,
                severity: "critical",
            };
        }
        const pkg = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf-8"));
        const hasBuildScript = Boolean(pkg.scripts?.build);
        const usesTypeScript = fs_1.default.existsSync(tsconfigPath);
        // 2. TypeScript but no build script
        if (usesTypeScript && !hasBuildScript) {
            score = 10;
            findings.push({
                type: "error",
                message: "TypeScript project detected but no build script found in package.json.",
                evidence: "tsconfig.json exists but scripts.build is undefined",
                suggestion: 'Add a build script (e.g., `"build": "tsc"`) to compile TypeScript before deployment.',
            });
            return {
                name: this.name,
                success: false,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: (0, severity_1.calculateSeverity)(score, this.MAX_SCORE),
            };
        }
        // 3. No build script at all
        if (!hasBuildScript) {
            findings.push({
                type: "warning",
                message: "No build script found in package.json.",
                suggestion: "Consider defining a build step to ensure consistent production builds.",
            });
            return {
                name: this.name,
                success: true,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: (0, severity_1.calculateSeverity)(score, this.MAX_SCORE),
            };
        }
        // Execute build safely
        try {
            const { stdout, stderr } = await (0, execa_1.execa)("npm", ["run", "build"], {
                cwd: projectRoot,
                timeout: this.BUILD_TIMEOUT_MS,
            });
            const combineOutput = `${stdout}\n${stderr}`;
            const warningCount = (combineOutput.match(/warning/gi) || []).length;
            if (warningCount > 0) {
                const deduction = Math.min(warningCount * 2, 20);
                score -= deduction;
                findings.push({
                    type: "warning",
                    message: `${warningCount} build warning(s) detected.`,
                    suggestion: "Resolve build warnings to improve production stability and reduce hidden runtime issues."
                });
            }
            if (score < 0)
                score = 0;
            return {
                name: this.name,
                success: score === this.MAX_SCORE,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: (0, severity_1.calculateSeverity)(score, this.MAX_SCORE),
            };
        }
        catch (err) {
            score = 0;
            findings.push({
                type: "error",
                message: "Build execution failed.",
                evidence: err?.stderr || err?.message,
                suggestion: "Fix build errors before deployment. Ensure the project builds successfully in a clean environment."
            });
            return {
                name: this.name,
                success: false,
                findings,
                scoreImpact: score,
                maxScore: this.MAX_SCORE,
                severity: "critical"
            };
        }
    }
}
exports.BuildAnalyzer = BuildAnalyzer;

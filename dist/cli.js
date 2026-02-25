#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const scan_1 = require("./core/scan");
const build_1 = require("./analyzers/build");
const env_1 = require("./analyzers/env");
const network_1 = require("./analyzers/network");
const runtime_1 = require("./analyzers/runtime");
const projectUtils_1 = require("./utils/projectUtils");
const ci_1 = require("./utils/ci");
const program = new commander_1.Command();
function renderProgressBar(percentage, length = 20) {
    const safe = Math.max(0, Math.min(percentage, 100));
    const filled = Math.round((safe / 100) * length);
    const bar = "█".repeat(filled) + "░".repeat(length - filled);
    return `[${bar}] ${safe.toFixed(1)}%`;
}
program
    .name("bridgepreflight")
    .description("AI-native production safety scanner")
    .version("0.0.1");
program
    .command("scan")
    .option("--json", "Output results as JSON (for CI pipelines)")
    .description("Run production safety checks")
    .action(async (options) => {
    console.log(chalk_1.default.blue("\nWelcome to BridgePreflight — The Deployment Risk Intelligence Platform \n"));
    const ciMode = (0, ci_1.isCI)();
    if (!ciMode) {
        const accessGranted = await (0, projectUtils_1.askProjectAccess)();
        if (!accessGranted) {
            console.log(chalk_1.default.blue("\nThank you for using BridgePreflight"));
            process.exit(0);
        }
    }
    else {
        console.log(chalk_1.default.gray("CI environment detected — interactive prompts disabled."));
    }
    const projectType = (0, projectUtils_1.detectProjectType)();
    if (projectType === "static") {
        console.log(chalk_1.default.yellow("Detected static HTML/CSS/JS project. Node-specific checks will be skipped."));
    }
    let spinner;
    try {
        const ora = (await Promise.resolve().then(() => __importStar(require("ora")))).default;
        spinner = ora("Running analyzers...").start();
        const allAnalyzers = [
            new build_1.BuildAnalyzer(),
            new env_1.EnvAnalyzer(),
            new network_1.NetworkAnalyzer(),
            new runtime_1.RuntimeAnalyzer(),
        ];
        const analyzers = allAnalyzers.filter((a) => a.supports.includes(projectType) ||
            a.supports.includes("all"));
        const skippedAnalyzers = allAnalyzers.filter((a) => !analyzers.includes(a));
        const engine = new scan_1.ScanEngine(analyzers);
        const results = await engine.runAll();
        spinner.stop();
        // =============================
        // 1. Scoring System
        // =============================
        let totalScore = 0;
        let totalMaxScore = 0;
        let weightedScore = 0;
        let weightedMaxScore = 0;
        results.forEach(({ analyzer, result }) => {
            const weight = analyzer.weight ?? 1;
            totalScore += result.scoreImpact;
            totalMaxScore += result.maxScore;
            weightedScore += result.scoreImpact * weight;
            weightedMaxScore += result.maxScore * weight;
        });
        const percentage = weightedMaxScore === 0
            ? 100
            : (weightedScore / weightedMaxScore) * 100;
        let readinessLabel;
        let readinessColor;
        if (percentage >= 90) {
            readinessLabel = "Safe to Deploy";
            readinessColor = chalk_1.default.green;
        }
        else if (percentage >= 70) {
            readinessLabel = "Deploy with Caution";
            readinessColor = chalk_1.default.yellow;
        }
        else {
            readinessLabel = "High Risk";
            readinessColor = chalk_1.default.red;
        }
        // =============================
        // 2. Top Risk Detection
        // =============================
        let topRisk;
        let lowestHealth = 101;
        for (const { result } of results) {
            if (result.maxScore === 0)
                continue;
            const health = (result.scoreImpact / result.maxScore) * 100;
            if (health < lowestHealth) {
                lowestHealth = health;
                topRisk = {
                    name: result.name,
                    health,
                };
            }
        }
        // =============================
        // JSON Output Mode
        // =============================
        if (options.json) {
            console.log(JSON.stringify({
                totalScore,
                maxScore: totalMaxScore,
                percentage,
                readiness: readinessLabel,
                results,
            }, null, 2));
            process.exit(percentage < 70 ? 1 : 0);
        }
        // =============================
        // 3. Analyzer Overview
        // =============================
        console.log(chalk_1.default.blue("\n--- BridgePreflight Scan ---\n"));
        results.forEach(({ result, duration }) => {
            const health = result.maxScore === 0
                ? 100
                : (result.scoreImpact / result.maxScore) * 100;
            const icon = health >= 90 ? "✅" :
                health >= 70 ? "⚠" : "❌";
            const color = health >= 90
                ? chalk_1.default.green
                : health >= 70
                    ? chalk_1.default.yellow
                    : chalk_1.default.red;
            console.log(color(`${icon} ${result.name} (${result.scoreImpact}/${result.maxScore}) - ${duration}ms`));
            console.log(color(`   ${renderProgressBar(health)}`));
        });
        // Show skipped analyzers clearly
        skippedAnalyzers.forEach((a) => {
            console.log(chalk_1.default.gray(`➖ ${a.name} skipped for ${projectType} project.`));
        });
        // =============================
        // 4. Total Summary
        // =============================
        console.log(chalk_1.default.blue("\n-----------------------------"));
        console.log(chalk_1.default.magenta.bold(`Total Score: ${totalScore}/${totalMaxScore} (${percentage.toFixed(1)}%)`));
        console.log(chalk_1.default.gray("Weighted scoring applied based on risk category"));
        console.log(readinessColor.bold(`Readiness: ${readinessLabel}`));
        if (topRisk && topRisk.health < 100) {
            const riskColor = topRisk.health >= 70
                ? chalk_1.default.yellow
                : chalk_1.default.red;
            console.log(riskColor.bold(`Top Risk Area: ${topRisk.name} (${topRisk.health.toFixed(1)}% health)`));
        }
        else {
            console.log(chalk_1.default.gray("Top Risk Area: None (all checks passed)"));
        }
        console.log(chalk_1.default.blue("-----------------------------\n"));
        // =============================
        // 5. Detailed Findings
        // =============================
        console.log(chalk_1.default.cyan.bold("--- Detailed Findings ---\n"));
        results.forEach(({ analyzer, result }) => {
            if (result.findings.length === 0)
                return;
            console.log(chalk_1.default.yellow.bold(`${analyzer.name} Findings:`));
            result.findings.forEach((f) => {
                const typeColor = f.type === "error"
                    ? chalk_1.default.red.bold
                    : f.type === "warning"
                        ? chalk_1.default.yellow.bold
                        : chalk_1.default.blue;
                console.log(typeColor(`   • ${f.type.toUpperCase()}: ${f.message}`));
                if (f.evidence) {
                    console.log(chalk_1.default.gray(`     • Evidence: ${f.evidence}`));
                }
                if (f.suggestion) {
                    console.log(chalk_1.default.cyan(`     → Suggested action: ${f.suggestion}`));
                }
            });
            console.log("");
        });
        if (percentage < 70)
            process.exit(1);
    }
    catch (error) {
        if (spinner)
            spinner.stop();
        console.error(chalk_1.default.red("Error running scan:"), error);
        process.exit(1);
    }
});
program.parse(process.argv);

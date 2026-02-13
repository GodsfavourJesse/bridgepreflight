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
const program = new commander_1.Command();
program
    .name("bridgepreflight")
    .description("AI-native production safety scanner")
    .version("0.0.1");
program
    .command("scan")
    .option("--json", "Output results as JSON (for CI pipelines")
    .description("Run production safety checks")
    .action(async (options) => {
    try {
        const ora = (await Promise.resolve().then(() => __importStar(require("ora")))).default;
        const chalk = (await Promise.resolve().then(() => __importStar(require("chalk")))).default;
        console.log(chalk.blue("\nRunning BridgePreflight scan...\n"));
        const spinner = ora("Running analyzers...").start();
        const engine = new scan_1.ScanEngine([
            new build_1.BuildAnalyzer(),
            new env_1.EnvAnalyzer(),
            new network_1.NetworkAnalyzer()
        ]);
        const results = await engine.runAll();
        spinner.stop();
        let totalScore = 0;
        // Max weights must match analyzers
        const weights = {
            "Build Check": 50,
            "Environment Variables Check": 30,
            "Localhost Leak Check": 20
        };
        results.forEach((res) => {
            totalScore += res.scoreImpact;
        });
        // Determine readiness label
        let readinessLabel = "";
        let readinessColor;
        if (totalScore >= 90) {
            readinessLabel = "Safe to Deploy";
            readinessColor = chalk.green;
        }
        else if (totalScore >= 70) {
            readinessLabel = "Deploy with Caution";
            readinessColor = chalk.yellow;
        }
        else {
            readinessLabel = "High Risk";
            readinessColor = chalk.red;
        }
        // JSON Mode (CI-friendly)
        if (options.json) {
            console.log(JSON.stringify({
                totalScore,
                readiness: readinessLabel,
                results
            }, null, 2));
            // Fail CI if below 70
            process.exit(totalScore < 70 ? 1 : 0);
        }
        // Pretty Console Output
        results.forEach((res) => {
            const max = weights[res.name] || 0;
            const health = max ? (res.scoreImpact / max) * 100 : 0;
            if (health === 100) {
                console.log(chalk.green(`✅ ${res.name}: Healthy (${res.scoreImpact}/${max})`));
            }
            else if (health >= 50) {
                console.log(chalk.yellow(`⚠ ${res.name}: Degraded (${res.scoreImpact}/${max})`));
            }
            else {
                console.log(chalk.red(`❌ ${res.name}: Critical (${res.scoreImpact}/${max})`));
            }
            res.errors.forEach((w) => console.log(chalk.yellow(`   • ${w}`)));
            res.errors.forEach((e) => console.log(chalk.red(`   • ${e}`)));
        });
        console.log(chalk.blue("\n-----------------------------"));
        console.log(chalk.magenta(`Total Score: ${totalScore}/100`));
        console.log(readinessColor(`Readiness: ${readinessLabel}`));
        console.log(chalk.blue("-----------------------------\n"));
        // Explain Mode
        const severityOrder = {
            critical: 5,
            high: 4,
            medium: 3,
            low: 2,
            healthy: 1
        };
        const riskFactors = results
            .filter((r) => r.severity !== "healthy")
            .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
        if (riskFactors.length > 0) {
            console.log("\nTop Risk Factors:");
            riskFactors.forEach((risk) => {
                const color = risk.severity === "critical"
                    ? chalk.red
                    : risk.severity === "high"
                        ? chalk.yellow
                        : risk.severity === "medium"
                            ? chalk.hex("#FFA500")
                            : chalk.gray;
                console.log(color(`• ${risk.name} (${risk.severity.toUpperCase()})`));
            });
            console.log();
        }
        // Exit code for non-CI mode (optional but professional)
        if (totalScore < 70) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("Error running scan:"), error);
        process.exit(1);
    }
});
program.parse(process.argv);

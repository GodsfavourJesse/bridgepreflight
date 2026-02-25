#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { ScanEngine } from "./core/scan";
import { BuildAnalyzer } from "./analyzers/build";
import { EnvAnalyzer } from "./analyzers/env";
import { NetworkAnalyzer } from "./analyzers/network";
import { RuntimeAnalyzer } from "./analyzers/runtime";
import { askProjectAccess, detectProjectType } from "./utils/projectUtils";
import { isCI } from "./utils/ci";

const program = new Command();

function renderProgressBar(percentage: number, length = 20) {
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

        console.log(
            chalk.blue(
                "\nWelcome to BridgePreflight — The Deployment Risk Intelligence Platform \n"
            )
        );

        const ciMode = isCI();

        if (!ciMode) {
            const accessGranted = await askProjectAccess();
            if (!accessGranted) {
                console.log(chalk.blue("\nThank you for using BridgePreflight"));
                process.exit(0);
            }
        } else {
            console.log(
                chalk.gray("CI environment detected — interactive prompts disabled.")
            );
        }

        const projectType = detectProjectType();

        if (projectType === "static") {
            console.log(
                chalk.yellow(
                    "Detected static HTML/CSS/JS project. Node-specific checks will be skipped."
                )
            );
        }

        let spinner: any;

        try {
            const ora = (await import("ora")).default;
            spinner = ora("Running analyzers...").start();

            const allAnalyzers = [
                new BuildAnalyzer(),
                new EnvAnalyzer(),
                new NetworkAnalyzer(),
                new RuntimeAnalyzer(),
            ];

            const analyzers = allAnalyzers.filter(
                (a) =>
                    a.supports.includes(projectType as any) ||
                    a.supports.includes("all")
            );

            const skippedAnalyzers = allAnalyzers.filter(
                (a) => !analyzers.includes(a)
            );

            const engine = new ScanEngine(analyzers);
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

            const percentage =
                weightedMaxScore === 0
                    ? 100
                    : (weightedScore / weightedMaxScore) * 100;

            let readinessLabel: string;
            let readinessColor: typeof chalk.green;

            if (percentage >= 90) {
                readinessLabel = "Safe to Deploy";
                readinessColor = chalk.green;
            } else if (percentage >= 70) {
                readinessLabel = "Deploy with Caution";
                readinessColor = chalk.yellow;
            } else {
                readinessLabel = "High Risk";
                readinessColor = chalk.red;
            }

            // =============================
            // 2. Top Risk Detection
            // =============================
            let topRisk:
                | { name: string; health: number }
                | undefined;

            let lowestHealth = 101;

            for (const { result } of results) {
                if (result.maxScore === 0) continue;

                const health =
                    (result.scoreImpact / result.maxScore) * 100;

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
                console.log(
                    JSON.stringify(
                        {
                            totalScore,
                            maxScore: totalMaxScore,
                            percentage,
                            readiness: readinessLabel,
                            results,
                        },
                        null,
                        2
                    )
                );

                process.exit(percentage < 70 ? 1 : 0);
            }

            // =============================
            // 3. Analyzer Overview
            // =============================
            console.log(chalk.blue("\n--- BridgePreflight Scan ---\n"));

            results.forEach(({ result, duration }) => {

                const health =
                    result.maxScore === 0
                        ? 100
                        : (result.scoreImpact / result.maxScore) * 100;

                const icon =
                    health >= 90 ? "✅" :
                    health >= 70 ? "⚠" : "❌";

                const color =
                    health >= 90
                        ? chalk.green
                        : health >= 70
                        ? chalk.yellow
                        : chalk.red;

                console.log(
                    color(
                        `${icon} ${result.name} (${result.scoreImpact}/${result.maxScore}) - ${duration}ms`
                    )
                );

                console.log(color(`   ${renderProgressBar(health)}`));
            });

            // Show skipped analyzers clearly
            skippedAnalyzers.forEach((a) => {
                console.log(
                    chalk.gray(`➖ ${a.name} skipped for ${projectType} project.`)
                );
            });

            // =============================
            // 4. Total Summary
            // =============================
            console.log(chalk.blue("\n-----------------------------"));

            console.log(
                chalk.magenta.bold(
                    `Total Score: ${totalScore}/${totalMaxScore} (${percentage.toFixed(1)}%)`
                )
            );

            console.log(
                chalk.gray("Weighted scoring applied based on risk category")
            );

            console.log(
                readinessColor.bold(`Readiness: ${readinessLabel}`)
            );

            if (topRisk && topRisk.health < 100) {
                const riskColor =
                    topRisk.health >= 70
                        ? chalk.yellow
                        : chalk.red;

                console.log(
                    riskColor.bold(
                        `Top Risk Area: ${topRisk.name} (${topRisk.health.toFixed(1)}% health)`
                    )
                );
            } else {
                console.log(
                    chalk.gray("Top Risk Area: None (all checks passed)")
                );
            }

            console.log(chalk.blue("-----------------------------\n"));

            // =============================
            // 5. Detailed Findings
            // =============================
            console.log(chalk.cyan.bold("--- Detailed Findings ---\n"));

            results.forEach(({ analyzer, result }) => {

                if (result.findings.length === 0) return;

                console.log(
                    chalk.yellow.bold(`${analyzer.name} Findings:`)
                );

                result.findings.forEach((f) => {

                    const typeColor =
                        f.type === "error"
                            ? chalk.red.bold
                            : f.type === "warning"
                            ? chalk.yellow.bold
                            : chalk.blue;

                    console.log(
                        typeColor(`   • ${f.type.toUpperCase()}: ${f.message}`)
                    );

                    if (f.evidence) {
                        console.log(
                            chalk.gray(`     • Evidence: ${f.evidence}`)
                        );
                    }

                    if (f.suggestion) {
                        console.log(
                            chalk.cyan(
                                `     → Suggested action: ${f.suggestion}`
                            )
                        );
                    }
                });

                console.log("");
            });

            if (percentage < 70) process.exit(1);

        } catch (error) {
            if (spinner) spinner.stop();
            console.error(chalk.red("Error running scan:"), error);
            process.exit(1);
        }
    });

program.parse(process.argv);
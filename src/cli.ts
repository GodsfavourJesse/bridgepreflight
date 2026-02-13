#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { ScanEngine } from "./core/scan";
import { BuildAnalyzer } from "./analyzers/build";
import { EnvAnalyzer } from "./analyzers/env";
import { NetworkAnalyzer } from "./analyzers/network";

const program = new Command();

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
            const ora = (await import("ora")).default;
            const chalk = (await import("chalk")).default;

            console.log(chalk.blue("\nRunning BridgePreflight scan...\n"));

            const spinner = ora("Running analyzers...").start();

            const engine = new ScanEngine([
                new BuildAnalyzer(),
                new EnvAnalyzer(),
                new NetworkAnalyzer()
            ]);

            const results = await engine.runAll();

            spinner.stop();

            let totalScore = 0;

            // Max weights must match analyzers
            const weights: Record<string, number> = {
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
            } else if (totalScore >= 70) {
                readinessLabel = "Deploy with Caution";
                readinessColor = chalk.yellow;
            } else {
                readinessLabel = "High Risk";
                readinessColor = chalk.red;
            }

            // JSON Mode (CI-friendly)
            if (options.json) {
                console.log(
                    JSON.stringify(
                        {
                            totalScore,
                            readiness: readinessLabel,
                            results
                        },
                        null,
                        2
                    )
                );

                // Fail CI if below 70
                process.exit(totalScore < 70 ? 1 : 0);
            }

            // Pretty Console Output
            results.forEach((res) => {
                const max = weights[res.name] || 0;
                const health = max ? (res.scoreImpact / max) * 100 : 0;
                

                if (health === 100) {
                    console.log(
                        chalk.green(
                            `✅ ${res.name}: Healthy (${res.scoreImpact}/${max})`
                        )
                    );
                } else if (health >= 50) {
                    console.log(
                        chalk.yellow(
                            `⚠ ${res.name}: Degraded (${res.scoreImpact}/${max})`
                        )
                    );
                } else {
                    console.log(
                        chalk.red(
                            `❌ ${res.name}: Critical (${res.scoreImpact}/${max})`
                        )
                    );
                }
                res.errors.forEach((w) => 
                    console.log(chalk.yellow(`   • ${w}`))
                );
                res.errors.forEach((e) => 
                    console.log(chalk.red(`   • ${e}`))
                );
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
                .sort(
                    (a, b) =>
                        severityOrder[b.severity] - severityOrder[a.severity]
                );
            
            if (riskFactors.length > 0) {
                console.log("\nTop Risk Factors:");

                riskFactors.forEach((risk) => {
                    const color =
                        risk.severity === "critical"
                            ? chalk.red
                            : risk.severity === "high"
                            ? chalk.yellow
                            : risk.severity === "medium"
                            ? chalk.hex("#FFA500")
                            : chalk.gray;
                    
                    console.log(
                        color(
                            `• ${risk.name} (${risk.severity.toUpperCase()})`
                        )
                    );
                });

                console.log();
            }

            // Exit code for non-CI mode (optional but professional)
            if (totalScore < 70) {
                process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red("Error running scan:"), error);
            process.exit(1);
        }
    });


program.parse(process.argv);
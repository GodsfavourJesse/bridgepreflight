import fs from "fs";
import chalk from "chalk";
import readline from "readline";
import { isCI } from "./ci";
import { ProjectType } from "../types";

// Prompt user with a question in CLI
export async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

// Ask the developer for permission to scan the project

export async function askProjectAccess(): Promise<boolean> {
    if (isCI()) return true;

    const answer = await prompt(chalk.blackBright("BridgePreflight needs access to scan your entire project. Allow? (y/n): "));
    return answer === "y";
}

// Detect project type: Node, Frontend, or Static HTML/CSS/JS

export function detectProjectType(): ProjectType {
    const files = fs.readdirSync(process.cwd());

    if (files.includes("package.json")) return "node";
    if (files.some(f => f.endsWith(".html"))) return "static";

    return "frontend";
}

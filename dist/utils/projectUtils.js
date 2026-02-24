"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompt = prompt;
exports.askProjectAccess = askProjectAccess;
exports.detectProjectType = detectProjectType;
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
const ci_1 = require("./ci");
// Prompt user with a question in CLI
async function prompt(question) {
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}
// Ask the developer for permission to scan the project
async function askProjectAccess() {
    if ((0, ci_1.isCI)())
        return true;
    const answer = await prompt(chalk_1.default.blackBright("BridgePreflight needs access to scan your entire project. Allow? (y/n): "));
    return answer === "y";
}
// Detect project type: Node, Frontend, or Static HTML/CSS/JS
function detectProjectType() {
    const files = fs_1.default.readdirSync(process.cwd());
    if (files.includes("package.json"))
        return "node";
    if (files.some(f => f.endsWith(".html")))
        return "static";
    return "frontend";
}

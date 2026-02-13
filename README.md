# BridgePreflight

![BridgePreflight](https://github.com/GodsfavourJesse/bridgepreflight/actions/workflows/bridgepreflight.yml/badge.svg)


<!------------------------------  ------------------------------------>
BridgePreflight

AI-native infrastructure readiness scanner for Node & TypeScript projects.

BridgePreflight analyzes your repository before code merges and assigns a Preflight Readiness Score (0–100) — automatically blocking pull requests that introduce risk.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
The Problem
Teams merge code that:
    • Has no tests
    • Breaks the build
    • Lacks documentation
    • Has weak repository hygiene
Issues are discovered too late — during staging or production.

BridgePreflight moves detection earlier — directly into CI.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
🎯 What BridgePreflight Does
BridgePreflight scans your repository and:
    • Generates an Infrastructure Readiness Score
    • Classifies readiness (Ready / Caution / Critical)
    • Identifies top risk factors
    • Automatically fails PRs if score < 70
    • Posts a structured risk summary comment on pull requests
It integrates directly into GitHub Actions for seamless enforcement.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
How It Works
BridgePreflight evaluates:
    • Test presence and structure
    • Build configuration
    • CI workflow setup
    • Documentation presence
    • Repository hygiene
Each category contributes weighted points to the final score.

If the score falls below the threshold:
    • The CI pipeline fails
    • The merge button is blocked
    • A risk summary is posted on the PR
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Installation (Local Usage)
    npm install
    npm run build
    node dist/cli.js scan


For machine-readable output:
    node dist/cli.js scan --json
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
GitHub Actions Integration
Place this file in:
    .github/workflows/bridgepreflight.yml


BridgePreflight will:
    • Run on every push to main
    • Run on every pull request
    • Automatically fail if readiness < 70
    • Comment with risk breakdown
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Example Output
    {
        "totalScore": 82,
        "readiness": "Ready",
        "results": [
            { "name": "Test Check", "severity": "healthy" },
            { "name": "Build Check", "severity": "warning" }
        ]
    }
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Why BridgePreflight Matters
BridgePreflight transforms infrastructure quality into a measurable metric.

It acts as:
    • A DevOps gatekeeper
    • A pre-merge risk detection layer
    • A credibility signal for repositories
Instead of hoping code is safe — you measure it.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Roadmap
    • Configurable scoring weights
    • Plugin-based analyzer system
    • Historical score tracking
    • SaaS dashboard
    • AI-based remediation suggestions
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
📄 License
MIT
<!------------------------------  ------------------------------------>
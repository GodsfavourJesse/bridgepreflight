# BridgePreflight

![BridgePreflight](https://github.com/GodsfavourJesse/bridgepreflight/actions/workflows/bridgepreflight.yml/badge.svg)


<!------------------------------  ------------------------------------>
BridgePreflight

The Deployment Risk Intelligence Platform 

BridgePreflight is a production-readiness scanner that analyzes your codebase before deployment and generates a structured Deployment Risk Score.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
It identifies critical infrastructure weakness such as:
    • Broken or missing builds
    • Unsafe environment variable usage
    • Runtime incompatibility risks
    • Localhost leakage
    • Missing lockfiles or Node version enforcement
Issues are discovered too late — during staging or production.

BridgePreflight runs locally or in CI to prevent high-risk deployments before they happen.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
The Problem
Modern teams ship fast.

But deployments often fail because:
    • Runtime versions are inconsistent
    • Enviroment variables are misconfigured
    • Builds silently pass with warnings
    • Localhost endpoints leak into production
    • Dependency locking is missing
These issues are rarely caught early.

They surface in staging - or worse - in production
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
The Solution
Bridgepreflight introduces Deployment Risk Intelligence directly into your development workflow.

instead of guessing whether a repository is safe to deploy, you get:
    • A quantified Deployment Risk Sore
    • Structured analyzer breakdown
    • Severity classification (Healthy/ Low/ Medium/ High/ Critical)
    • Clear remediation signals
You move from reactive debugging to proactive risk prevention.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
What BridgePreflight Analyzes (v1.0.0)
Current analyzers include:

1. Build Check
    • Verifies package.json
    • Ensures build script exists
    • Detects TypeScript without proper build configuration
    • Captures build-time warnings

2. Environment Variables Check
    • Detects unsafe process.env usage
    • Flags missing configuration hygiene
    • Identifies potential production misconfiguration risks

3. Runtime Compatibility Check
    • Verifies Node engine specification
    • Detects missing .nvmrc or .node-version
    • Ensures lockfile presence

4. Localhost Leak Check
    • Scans for localhost and 127.0.0.1 usage
    • Prevents accidental production endpoint leakage
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
Installation

Global Installation (Recommended)
    npm install -g bridgepreflight

Run:
    bridgepreflight scan

Or without global install:
    npx bridgepreflight scan
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Example Output
    Running BridgePreflight scan...

    ✅ Build Check: HEALTHY (50/50)
    ❌ Environment Variables Check: HIGH (10/30)
    ⚠ Localhost Leak Check: LOW (16/20)
    ❌ Runtime Compatibility Check: HIGH (6/20)

    -----------------------------
    Total Score: 79/120 (65.8%)
    Readiness: High Risk
    -----------------------------

    Top Risk Factors:
    • Environment Variables Check
    • Runtime Compatibility Check
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
JSON Output
For machine-readable output:

    bridgepreflight scan --json

This enables CI integration and automated risk gating.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Scoring Model
BridgePreflight uses a weighted scoring model.

Each analyzer contributes to a maximum composite score (currently 120 points).

Severity is calculated proportionally:
    • Healthy
    • Low
    • Medium
    • High
    • Critical

The scoring model is deterministic and transparent.
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
CI Integration (Coming Next Phase)
BridgePreflight is designed to be CI-ready.

Upcoming native integrations:
    • Pull request gating
    • GitHub Actions workflow templates
    • Exit-code enforcement
    • Team policy thresholds
<!------------------------------  ------------------------------------>


<!------------------------------  ------------------------------------>
Roadmap
BridgePreflight is evolving into a comprehensive Deployment Risk Intelligence Platform.

Phase 1 - Deterministic CLI (Current)
    • Local development risk scanning
    • Weighted analyzer scoring
    • JSON output for CI integration
    • Structured severity classification

Phase 2 - Policy & Enforcement
    • Configurable scoring thresholds
    • Strict CI mode (--strict, --ci)
    • COnfigurable analyzer toggling
    • Exit-code enforcement policies

Phase 3 - Ecosystem Integration
    • Native GitHub Action
    • Pull request risk annotations
    • Historical score comparison
    • Team-level threshold configuration

Phase 4 - Platform Expansion
    • Risk history tracking
    • Deployment trend analysis
    • Team dashboards
    • Enterprise compliance modules
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
Contributing
BridgePreflight is currently in early-stage evolution.

Contributions are welcome in the following areas:

    • Analyzer improvements
    • Performance optimization
    • Additional infrastructure checks
    • Documentation refinement
    • CI templates

To contribute:
    1. Fork the repository
    2. Create a feature branch
    3.Submit a pull request with clear reasoning

All contributions should preserve deterministic scoring logic and architecture stability.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
Versioning
BridgePreflight follows semantic versioning:

MAJOR.MINOR.PATCH

    • MAJOR - Breaking changes
    • MINOR - New analyzers or features
    • PATCH - Bug fixes and improvements

GitHub releases are tagged accordingly
    • git tag v1.0.0
    • git push --tags

This aligns repository versions with npm releases.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
License
MIT License

Bridgepreflight is open-core infrastructure software.

Future cloud components may be distributed under seperate licensing.
<!------------------------------  ------------------------------------>



<!------------------------------  ------------------------------------>
Vision
BridgePreflight is not just a CLI tool.

It is the foundation of a Deployment Risk Intelligence Platform — designed to help teams measure, manage, and reduce infrastructure risk before code reaches production.

Infrastructure reliability should be measurable.

BridgePreflight makes it measurable.
<!------------------------------  ------------------------------------>
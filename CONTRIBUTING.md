# Contributing to BridgePreflight

Thank you for your interest in contributing to BridgePreflight.

BridgePreflight is a Deployment Risk Intelligence CLI focused on deterministic infrastructure analysis for Node.js projects. Contributions should preserve clarity, reliability, and scoring integrity.

---

## Contribution Principles

- Deterministic logic over probabilistic behavior
- Transparent scoring model
- Infrastructure-first mindset
- Minimal dependencies
- Clear and testable analyzers

---

## Development Setup

1. Clone the repository
2. Install dependencies:

   npm install

3. Build the project:

   npm run build

4. Run locally:

   node dist/cli.js scan

---

## Adding a New Analyzer

When introducing a new analyzer:

- It must return a structured result
- It must have a clearly defined maximum score
- It must not introduce non-deterministic behavior
- It must integrate into the weighted scoring model

All analyzers must include:
- Name
- Score
- Max score
- Severity classification
- Explanation (if risk detected)

---

## Pull Request Guidelines

- Create a feature branch
- Keep commits focused and atomic
- Provide a clear explanation of the change
- Avoid unrelated refactors

PRs introducing breaking changes must target a MAJOR version.

---

## Reporting Issues

When reporting issues, include:

- Node.js version
- Operating system
- BridgePreflight version
- Full CLI output (if possible)

---

Thank you for helping strengthen deployment reliability.
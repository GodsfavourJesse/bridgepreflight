"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSeverity = calculateSeverity;
function calculateSeverity(score, max) {
    const percent = max === 0 ? 100 : (score / max) * 100;
    if (percent === 100)
        return "healthy";
    if (percent >= 75)
        return "low";
    if (percent >= 50)
        return "medium";
    if (percent >= 25)
        return "high";
    return "critical";
}

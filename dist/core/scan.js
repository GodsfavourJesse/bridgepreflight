"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanEngine = void 0;
class ScanEngine {
    constructor(analyzers) {
        this.analyzers = analyzers;
    }
    async runAll() {
        const results = [];
        for (const analyzer of this.analyzers) {
            const start = Date.now();
            const result = await analyzer.run();
            const duration = Date.now() - start;
            results.push({
                analyzer,
                result,
                duration,
            });
        }
        return results;
    }
}
exports.ScanEngine = ScanEngine;

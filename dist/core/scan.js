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
            const result = await analyzer.run();
            results.push(result);
        }
        return results;
    }
}
exports.ScanEngine = ScanEngine;

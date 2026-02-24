import { Analyzer, AnalyzerResult } from "../types";

export interface ScanResult {
    analyzer: Analyzer;
    result: AnalyzerResult;
    duration: number;
}

export class ScanEngine {
    constructor(private analyzers: Analyzer[]) {}

    async runAll(): Promise<ScanResult[]> {
        const results: ScanResult[] = [];

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
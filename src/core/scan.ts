import { Analyzer, AnalyzerResult } from "../types";

export class ScanEngine {
    constructor(private analyzers: Analyzer[]) {}

    async runAll(): Promise<AnalyzerResult[]> {
        const results: AnalyzerResult[] = [];

        for (const analyzer of this.analyzers) {
            const result = await analyzer.run();
            results.push(result);
        }

        return results;
    }
}
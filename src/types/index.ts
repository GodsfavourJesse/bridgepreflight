export type Severity = "healthy" | "low" | "medium" | "high" | "critical";

export interface AnalyzerResult {
    name: string;
    success: boolean;
    warnings: string[];
    errors: string[];
    scoreImpact: number; //positive or negative contribution toward total
    severity: Severity;
}

export interface Analyzer {
    name: string;
    run(): Promise<AnalyzerResult>;
}
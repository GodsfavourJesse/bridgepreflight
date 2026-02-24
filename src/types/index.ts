export type Severity = "healthy" | "low" | "medium" | "high" | "critical";

export const PROJECT_TYPES = {
    NODE: "node",
    STATIC: "static",
    FRONTEND: "frontend",
} as const;

export type ProjectType = 
    typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];


export interface Finding {
    type: "info" | "warning" | "error";
    message: string;
    file?: string;
    evidence?: string;
    suggestion?: string;
}

export interface AnalyzerResult {
    name: string;
    success: boolean;
    findings: Finding[];
    scoreImpact: number; //positive or negative contribution toward total
    maxScore: number,
    severity: Severity;
}


export interface Analyzer {
    name: string;

    // Relative importance of this analyzer.
    // 1 = normal weight
    // >1 = higher impact
    // <1 = lower impact
    weight: number;

// Project types this analyzer supports.
    supports: (ProjectType | "all")[];

    run(): Promise<AnalyzerResult>;
}
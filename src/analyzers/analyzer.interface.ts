import { AnalysisResult } from "../models/analysis-result";

export interface Analyzer {
    analyze: (code: string) => Promise<AnalysisResult>
}
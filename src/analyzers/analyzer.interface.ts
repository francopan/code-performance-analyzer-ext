import { AnalysisResult } from "../models/analysis-result.model";

export interface Analyzer {
    analyze: (code: string, runs?: Array<number>) => Promise<AnalysisResult>
}
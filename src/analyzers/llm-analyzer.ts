import axios from "axios";
import { prompts } from "../constants/prompts.const";
import { AnalysisResult } from "../models/analysis-result";
import { Analyzer } from "./analyzer.interface";

export class LLMAnalyzer implements Analyzer {

    private readonly llmAPIURL = 'http://127.0.0.1:11434/api/generate';

    public async analyze(code: string): Promise<AnalysisResult> {
        const prompt = prompts.analyzeCode.replace('{{code}}', code);
        try {
            const response = await axios.post(this.llmAPIURL, {
                model: 'mistral',
                prompt: prompt,
                stream: false
            });

            const responseText = response.data.response.trim();
            return this.parseAnalysisResult(responseText);
        } catch (error) {
            console.error('Error while analyzing code with LLM:', error);
            throw new Error('Failed to analyze code with LLM');
        }
    }

    private parseAnalysisResult(responseText: string): AnalysisResult {
        try {
            return JSON.parse(responseText) as AnalysisResult;
        } catch (error) {
            console.error('Failed to parse JSON response:', responseText);
            throw new Error('Invalid JSON response');
        }
    }
}
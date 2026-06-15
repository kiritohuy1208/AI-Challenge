import type { CalculationResult } from "../types/calculation";
import type { FinalSummary } from "../types/calculation";
/**
 * Formats a single calculation result as a readable summary line.
 */
export declare function formatResultLine(result: CalculationResult): string;
/**
 * Formats the final summary as a readable block.
 */
export declare function formatSummary(summary: FinalSummary): string;

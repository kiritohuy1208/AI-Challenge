import type { CalculationResult } from "../types/calculation";
import type { FinalSummary } from "../types/calculation";

/**
 * Formats a single calculation result as a readable summary line.
 */
export function formatResultLine(result: CalculationResult): string {
  return `[${result.expense_id}] ${result.decision}: covered ${result.covered_amount}, member pays ${result.member_pays} — ${result.reason}`;
}

/**
 * Formats the final summary as a readable block.
 */
export function formatSummary(summary: FinalSummary): string {
  const benefitLines = Object.entries(summary.remaining_annual_limit_by_benefit)
    .map(([benefit, limit]) => `  ${benefit}: ${limit}`)
    .join("\n");

  return [
    `Total submitted: ${summary.total_submitted_amount}`,
    `Total covered: ${summary.total_covered_amount}`,
    `Total member pays: ${summary.total_member_pays}`,
    `Remaining deductible: ${summary.remaining_deductible_amount}`,
    "Remaining annual limits:",
    benefitLines,
  ].join("\n");
}

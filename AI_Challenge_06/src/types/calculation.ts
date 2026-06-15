/**
 * Decision status for each processed expense.
 */
export type CoverageDecision = "COVERED" | "PARTIALLY_COVERED" | "DENIED";

/**
 * Per-expense output after applying policy rules.
 */
export interface CalculationResult {
  expense_id: string;
  submitted_amount: number;
  covered_amount: number;
  copay_amount: number;
  member_pays: number;
  decision: CoverageDecision;
  reason: string;
  remaining_annual_limit: number;
  remaining_visit_limit: number;
}

/**
 * Final aggregate output after processing all expenses.
 */
export interface FinalSummary {
  total_submitted_amount: number;
  total_covered_amount: number;
  total_member_pays: number;
  remaining_annual_limit_by_benefit: Record<string, number>;
  remaining_deductible_amount: number;
}

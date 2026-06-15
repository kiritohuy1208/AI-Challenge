import type { Policy } from "../types/policy";
import type { Expense } from "../types/expense";
import type { CalculationResult, FinalSummary } from "../types/calculation";
export interface ProcessExpensesResult {
    results: CalculationResult[];
    summary: FinalSummary;
}
/**
 * Core benefits calculator — processes expenses chronologically against policy rules.
 *
 * Pipeline per expense (AGENTS.md order):
 * Exclusion → Waiting Period → Deductible → Sub-limit → Copay → Annual Limit → Decision
 */
export declare class BenefitsCalculator {
    processExpenses(policy: Policy, expenses: Expense[]): ProcessExpensesResult;
    private initializeState;
    private processSingleExpense;
    private buildDeniedResult;
    private buildResult;
    private buildSummary;
}

import type { CopayRule, Policy, SubBenefitPolicy } from "../types/policy";
import type { Expense } from "../types/expense";
export interface RuleOutcome {
    denied: boolean;
    reason?: string;
}
export interface DeductibleOutcome {
    amountAfterDeductible: number;
    deductibleApplied: number;
    reason?: string;
}
export interface SubLimitOutcome {
    eligibleAmount: number;
    excessAmount: number;
    reason?: string;
}
export interface CopayOutcome {
    coveredAmount: number;
    copayAmount: number;
    reason?: string;
}
export interface AnnualLimitOutcome {
    coveredAmount: number;
    cappedAmount: number;
    reason?: string;
}
/**
 * Rule 1: Reject expenses matching policy exclusions (sub-benefit or diagnosis).
 */
export declare function checkExclusion(policy: Policy, expense: Expense): RuleOutcome;
/**
 * Rule 2: Reject expenses submitted before the waiting period elapses.
 */
export declare function checkWaitingPeriod(policy: Policy, expense: Expense, subBenefit: SubBenefitPolicy): RuleOutcome;
/**
 * Rule 3: Apply annual deductible before insurance coverage begins.
 */
export declare function applyDeductible(policy: Policy, expense: Expense, submittedAmount: number, accumulatedDeductiblePaid: number): DeductibleOutcome;
/**
 * Rule 4: Cap eligible amount to the per-visit sub-limit.
 */
export declare function applyPerVisitSubLimit(amountAfterDeductible: number, perVisitLimit: number): SubLimitOutcome;
/**
 * Rule 5: Apply percentage or fixed copay to the eligible amount.
 */
export declare function applyCopay(eligibleAmount: number, copay: CopayRule): CopayOutcome;
/**
 * Rule 6: Cap insurer payment by the remaining annual benefit limit.
 */
export declare function applyAnnualLimitCap(coveredAmount: number, remainingAnnualLimit: number): AnnualLimitOutcome;
/**
 * Rule 7: Determine final decision from submitted vs covered amounts.
 */
export declare function determineDecision(submittedAmount: number, coveredAmount: number, forceDenied: boolean): "COVERED" | "PARTIALLY_COVERED" | "DENIED";

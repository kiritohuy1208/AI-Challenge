import type { Policy } from "../types/policy";
import type { Expense } from "../types/expense";
import type { CalculationResult, FinalSummary } from "../types/calculation";
import type { SubBenefitPolicy } from "../types/policy";
import { sortExpensesByDate, roundCurrency } from "../utils/helpers";
import { validateExpenses, validatePolicy } from "./validator";
import {
  applyCopay,
  applyDeductible,
  applyPerVisitSubLimit,
  checkExclusion,
  checkWaitingPeriod,
  determineDecision,
} from "./rules";

export interface ProcessExpensesResult {
  results: CalculationResult[];
  summary: FinalSummary;
}

/** Independent annual fund pool per benefit_type (OUTPATIENT, INPATIENT, …). */
interface BenefitFundState {
  remainingAnnualLimit: number;
}

interface CalculatorState {
  fundsByBenefitType: Record<string, BenefitFundState>;
  accumulatedDeductiblePaid: number;
}

interface PipelineAmounts {
  deductibleApplied: number;
  subLimitExcess: number;
  preAnnualCovered: number;
  copayAmount: number;
  reasons: string[];
}

/**
 * Core benefits calculator — processes expenses chronologically against policy rules.
 *
 * Pipeline per expense (AGENTS.md order):
 * Exclusion → Waiting Period → Deductible → Sub-limit → Copay → Annual Limit → Decision
 */
export class BenefitsCalculator {
  processExpenses(
    policy: Policy,
    expenses: Expense[]
  ): ProcessExpensesResult {
    validatePolicy(policy);
    validateExpenses(expenses);

    const sortedExpenses = sortExpensesByDate(expenses);
    const state = this.initializeState(policy);
    const results: CalculationResult[] = [];

    for (const expense of sortedExpenses) {
      results.push(this.processSingleExpense(policy, expense, state));
    }

    return {
      results,
      summary: this.buildSummary(sortedExpenses, results, policy, state),
    };
  }

  private initializeState(policy: Policy): CalculatorState {
    const fundsByBenefitType: Record<string, BenefitFundState> = {};

    for (const [benefitType, benefit] of Object.entries(policy.benefits)) {
      fundsByBenefitType[benefitType] = {
        remainingAnnualLimit: benefit.annual_limit,
      };
    }

    return {
      fundsByBenefitType,
      accumulatedDeductiblePaid: 0,
    };
  }

  /** Reads remaining annual balance for one benefit_type only — pools never cross. */
  private getRemainingAnnualLimit(
    state: CalculatorState,
    benefitType: string
  ): number {
    return state.fundsByBenefitType[benefitType]?.remainingAnnualLimit ?? 0;
  }

  /** Deducts insurer payment from the matching benefit_type pool only. */
  private consumeAnnualLimit(
    state: CalculatorState,
    benefitType: string,
    coveredAmount: number
  ): number {
    const fund = state.fundsByBenefitType[benefitType];
    if (!fund) {
      return 0;
    }

    fund.remainingAnnualLimit = roundCurrency(
      fund.remainingAnnualLimit - coveredAmount
    );
    return fund.remainingAnnualLimit;
  }

  /**
   * Per-visit sub-limit resets every visit — output always shows the policy
   * default cap available for the next visit of this sub-benefit.
   */
  private nextVisitLimit(subBenefit: SubBenefitPolicy): number {
    return subBenefit.per_visit_limit;
  }

  /**
   * Applies annual cap and enforces cash-flow invariant:
   * member_pays === submitted_amount - covered_amount
   */
  private applyAnnualCapAndBalance(
    submittedAmount: number,
    preAnnualCovered: number,
    remainingAnnualLimit: number,
    pipeline: PipelineAmounts
  ): {
    coveredAmount: number;
    memberPays: number;
    copayAmount: number;
  } {
    const coveredAmount = roundCurrency(
      Math.min(Math.max(0, preAnnualCovered), remainingAnnualLimit)
    );
    const memberPays = roundCurrency(submittedAmount - coveredAmount);

    let copayAmount = pipeline.copayAmount;
    if (coveredAmount === 0) {
      copayAmount = 0;
    }

    const annualShortfall = roundCurrency(preAnnualCovered - coveredAmount);
    if (annualShortfall > 0) {
      if (remainingAnnualLimit === 0 && preAnnualCovered > 0) {
        pipeline.reasons.push(
          `Annual limit for this benefit type is exhausted; no insurance payment available.`
        );
      } else {
        pipeline.reasons.push(
          `Annual limit cap applied; insurer pays ${coveredAmount} THB of ${preAnnualCovered} THB calculated coverage (${annualShortfall} THB member responsibility).`
        );
      }
    }

    return { coveredAmount, memberPays, copayAmount };
  }

  private processSingleExpense(
    policy: Policy,
    expense: Expense,
    state: CalculatorState
  ): CalculationResult {
    const submittedAmount = expense.amount;
    const benefitType = expense.benefit_type;
    const benefit = policy.benefits[benefitType];
    const nextVisitLimitDefault = 0;

    if (!benefit) {
      return this.buildDeniedResult(
        expense,
        submittedAmount,
        nextVisitLimitDefault,
        `Expense denied: benefit type "${benefitType}" is not covered.`,
        state
      );
    }

    const subBenefit = benefit.sub_benefits[expense.sub_benefit];
    if (!subBenefit) {
      return this.buildDeniedResult(
        expense,
        submittedAmount,
        nextVisitLimitDefault,
        `Expense denied: sub-benefit "${expense.sub_benefit}" is not covered.`,
        state,
        benefitType
      );
    }

    const visitLimitForNext = this.nextVisitLimit(subBenefit);
    const remainingAnnualForBenefit = this.getRemainingAnnualLimit(
      state,
      benefitType
    );

    // Rule 1: Exclusion
    const exclusion = checkExclusion(policy, expense);
    if (exclusion.denied) {
      return this.buildDeniedResult(
        expense,
        submittedAmount,
        visitLimitForNext,
        exclusion.reason!,
        state,
        benefitType
      );
    }

    // Rule 2: Waiting Period
    const waitingPeriod = checkWaitingPeriod(policy, expense, subBenefit);
    if (waitingPeriod.denied) {
      return this.buildDeniedResult(
        expense,
        submittedAmount,
        visitLimitForNext,
        waitingPeriod.reason!,
        state,
        benefitType
      );
    }

    if (remainingAnnualForBenefit === 0) {
      return this.buildDeniedResult(
        expense,
        submittedAmount,
        visitLimitForNext,
        "Annual limit for this benefit type is exhausted; no insurance payment available.",
        state,
        benefitType
      );
    }

    const pipeline: PipelineAmounts = {
      deductibleApplied: 0,
      subLimitExcess: 0,
      preAnnualCovered: 0,
      copayAmount: 0,
      reasons: [],
    };

    // Rule 3: Deductible
    const deductible = applyDeductible(
      policy,
      expense,
      submittedAmount,
      state.accumulatedDeductiblePaid
    );
    if (deductible.reason) {
      pipeline.reasons.push(deductible.reason);
    }
    pipeline.deductibleApplied = deductible.deductibleApplied;
    state.accumulatedDeductiblePaid += deductible.deductibleApplied;

    if (deductible.amountAfterDeductible === 0) {
      return this.buildResult(
        expense,
        submittedAmount,
        0,
        0,
        submittedAmount,
        "PARTIALLY_COVERED",
        pipeline.reasons.join(" ") ||
          "Full amount applied to annual deductible; no insurance payment.",
        remainingAnnualForBenefit,
        visitLimitForNext
      );
    }

    // Rule 4: Per-visit Sub-limit
    const subLimit = applyPerVisitSubLimit(
      deductible.amountAfterDeductible,
      subBenefit.per_visit_limit
    );
    if (subLimit.reason) {
      pipeline.reasons.push(subLimit.reason);
    }
    pipeline.subLimitExcess = subLimit.excessAmount;

    // Rule 5: Copay
    const copay = applyCopay(subLimit.eligibleAmount, subBenefit.copay);
    if (copay.reason) {
      pipeline.reasons.push(copay.reason);
    }
    pipeline.preAnnualCovered = copay.coveredAmount;
    pipeline.copayAmount = copay.copayAmount;

    // Rule 6: Annual Limit Cap (scoped to this benefit_type's fund only)
    const { coveredAmount, memberPays, copayAmount } =
      this.applyAnnualCapAndBalance(
        submittedAmount,
        pipeline.preAnnualCovered,
        remainingAnnualForBenefit,
        pipeline
      );

    // Deduct only from the matching benefit_type pool
    const remainingAfterClaim = this.consumeAnnualLimit(
      state,
      benefitType,
      coveredAmount
    );

    // Rule 7: Decision
    const decision = determineDecision(submittedAmount, coveredAmount, false);
    const reason =
      pipeline.reasons.join(" ") ||
      `Covered: ${coveredAmount} THB. Member pays: ${memberPays} THB.`;

    return this.buildResult(
      expense,
      submittedAmount,
      coveredAmount,
      copayAmount,
      memberPays,
      decision,
      reason,
      remainingAfterClaim,
      visitLimitForNext
    );
  }

  private buildDeniedResult(
    expense: Expense,
    submittedAmount: number,
    visitLimitForNext: number,
    reason: string,
    state: CalculatorState,
    benefitType?: string
  ): CalculationResult {
    const remainingAnnual =
      benefitType !== undefined
        ? this.getRemainingAnnualLimit(state, benefitType)
        : 0;

    return this.buildResult(
      expense,
      submittedAmount,
      0,
      0,
      submittedAmount,
      "DENIED",
      reason,
      remainingAnnual,
      visitLimitForNext
    );
  }

  private buildResult(
    expense: Expense,
    submittedAmount: number,
    coveredAmount: number,
    copayAmount: number,
    memberPays: number,
    decision: CalculationResult["decision"],
    reason: string,
    remainingAnnualLimit: number,
    remainingVisitLimit: number
  ): CalculationResult {
    return {
      expense_id: expense.expense_id,
      submitted_amount: submittedAmount,
      covered_amount: coveredAmount,
      copay_amount: copayAmount,
      member_pays: roundCurrency(submittedAmount - coveredAmount),
      decision,
      reason,
      remaining_annual_limit: remainingAnnualLimit,
      remaining_visit_limit: remainingVisitLimit,
    };
  }

  private buildSummary(
    expenses: Expense[],
    results: CalculationResult[],
    policy: Policy,
    state: CalculatorState
  ): FinalSummary {
    const totalSubmitted = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCovered = results.reduce((sum, r) => sum + r.covered_amount, 0);
    const totalMemberPays = results.reduce((sum, r) => sum + r.member_pays, 0);

    const remainingAnnualLimitByBenefit: Record<string, number> = {};
    for (const [benefitType, fund] of Object.entries(
      state.fundsByBenefitType
    )) {
      remainingAnnualLimitByBenefit[benefitType] = fund.remainingAnnualLimit;
    }

    return {
      total_submitted_amount: roundCurrency(totalSubmitted),
      total_covered_amount: roundCurrency(totalCovered),
      total_member_pays: roundCurrency(totalMemberPays),
      remaining_annual_limit_by_benefit: remainingAnnualLimitByBenefit,
      remaining_deductible_amount: roundCurrency(
        Math.max(0, policy.deductible.amount - state.accumulatedDeductiblePaid)
      ),
    };
  }
}

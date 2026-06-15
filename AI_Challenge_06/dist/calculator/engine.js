"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenefitsCalculator = void 0;
const helpers_1 = require("../utils/helpers");
const validator_1 = require("./validator");
const rules_1 = require("./rules");
/**
 * Core benefits calculator — processes expenses chronologically against policy rules.
 *
 * Pipeline per expense (AGENTS.md order):
 * Exclusion → Waiting Period → Deductible → Sub-limit → Copay → Annual Limit → Decision
 */
class BenefitsCalculator {
    processExpenses(policy, expenses) {
        (0, validator_1.validatePolicy)(policy);
        (0, validator_1.validateExpenses)(expenses);
        const sortedExpenses = (0, helpers_1.sortExpensesByDate)(expenses);
        const state = this.initializeState(policy);
        const results = [];
        for (const expense of sortedExpenses) {
            const result = this.processSingleExpense(policy, expense, state);
            results.push(result);
        }
        return {
            results,
            summary: this.buildSummary(sortedExpenses, results, policy, state),
        };
    }
    initializeState(policy) {
        const remainingAnnualLimits = {};
        for (const [benefitType, benefit] of Object.entries(policy.benefits)) {
            remainingAnnualLimits[benefitType] = benefit.annual_limit;
        }
        return {
            remainingAnnualLimits,
            accumulatedDeductiblePaid: 0,
        };
    }
    processSingleExpense(policy, expense, state) {
        const submittedAmount = expense.amount;
        const benefit = policy.benefits[expense.benefit_type];
        const reasons = [];
        if (!benefit) {
            return this.buildDeniedResult(expense, submittedAmount, 0, `Expense denied: benefit type "${expense.benefit_type}" is not covered.`, state);
        }
        const subBenefit = benefit.sub_benefits[expense.sub_benefit];
        if (!subBenefit) {
            return this.buildDeniedResult(expense, submittedAmount, 0, `Expense denied: sub-benefit "${expense.sub_benefit}" is not covered.`, state, expense.benefit_type);
        }
        const remainingAnnualLimit = state.remainingAnnualLimits[expense.benefit_type] ?? 0;
        // Rule 1: Exclusion
        const exclusion = (0, rules_1.checkExclusion)(policy, expense);
        if (exclusion.denied) {
            return this.buildDeniedResult(expense, submittedAmount, subBenefit.per_visit_limit, exclusion.reason, state, expense.benefit_type);
        }
        // Rule 2: Waiting Period
        const waitingPeriod = (0, rules_1.checkWaitingPeriod)(policy, expense, subBenefit);
        if (waitingPeriod.denied) {
            return this.buildDeniedResult(expense, submittedAmount, subBenefit.per_visit_limit, waitingPeriod.reason, state, expense.benefit_type);
        }
        // Rule 3: Deductible
        const deductible = (0, rules_1.applyDeductible)(policy, expense, submittedAmount, state.accumulatedDeductiblePaid);
        if (deductible.reason) {
            reasons.push(deductible.reason);
        }
        state.accumulatedDeductiblePaid += deductible.deductibleApplied;
        if (deductible.amountAfterDeductible === 0) {
            const reason = reasons.join(" ");
            return this.buildResult(expense, submittedAmount, 0, 0, submittedAmount, "PARTIALLY_COVERED", reason || "Full amount applied to annual deductible; no insurance payment.", state.remainingAnnualLimits[expense.benefit_type] ?? 0, subBenefit.per_visit_limit);
        }
        // Rule 4: Per-visit Sub-limit
        const subLimit = (0, rules_1.applyPerVisitSubLimit)(deductible.amountAfterDeductible, subBenefit.per_visit_limit);
        if (subLimit.reason) {
            reasons.push(subLimit.reason);
        }
        // Rule 5: Copay
        const copay = (0, rules_1.applyCopay)(subLimit.eligibleAmount, subBenefit.copay);
        if (copay.reason) {
            reasons.push(copay.reason);
        }
        // Rule 6: Annual Limit Cap
        let coveredAmount = copay.coveredAmount;
        let copayAmount = copay.copayAmount;
        const annualCap = (0, rules_1.applyAnnualLimitCap)(coveredAmount, remainingAnnualLimit);
        if (annualCap.reason) {
            reasons.push(annualCap.reason);
            coveredAmount = annualCap.coveredAmount;
            if (coveredAmount === 0) {
                copayAmount = 0;
            }
        }
        // Update state after successful coverage
        state.remainingAnnualLimits[expense.benefit_type] = (0, helpers_1.roundCurrency)(remainingAnnualLimit - coveredAmount);
        const memberPays = (0, helpers_1.roundCurrency)(submittedAmount - coveredAmount);
        // Rule 7: Decision
        const decision = (0, rules_1.determineDecision)(submittedAmount, coveredAmount, false);
        const reason = reasons.join(" ") ||
            `Covered: ${coveredAmount} THB. Member pays: ${memberPays} THB.`;
        const amountAgainstVisitLimit = coveredAmount > 0
            ? Math.min(deductible.amountAfterDeductible, subBenefit.per_visit_limit)
            : 0;
        const remainingVisitLimit = (0, helpers_1.roundCurrency)(subBenefit.per_visit_limit - amountAgainstVisitLimit);
        return this.buildResult(expense, submittedAmount, coveredAmount, copayAmount, memberPays, decision, reason, state.remainingAnnualLimits[expense.benefit_type], remainingVisitLimit);
    }
    buildDeniedResult(expense, submittedAmount, perVisitLimit, reason, state, benefitType) {
        const remainingAnnual = benefitType !== undefined
            ? state.remainingAnnualLimits[benefitType] ?? 0
            : 0;
        return this.buildResult(expense, submittedAmount, 0, 0, submittedAmount, "DENIED", reason, remainingAnnual, perVisitLimit);
    }
    buildResult(expense, submittedAmount, coveredAmount, copayAmount, memberPays, decision, reason, remainingAnnualLimit, remainingVisitLimit) {
        return {
            expense_id: expense.expense_id,
            submitted_amount: submittedAmount,
            covered_amount: coveredAmount,
            copay_amount: copayAmount,
            member_pays: memberPays,
            decision,
            reason,
            remaining_annual_limit: remainingAnnualLimit,
            remaining_visit_limit: remainingVisitLimit,
        };
    }
    buildSummary(expenses, results, policy, state) {
        const totalSubmitted = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalCovered = results.reduce((sum, r) => sum + r.covered_amount, 0);
        const totalMemberPays = results.reduce((sum, r) => sum + r.member_pays, 0);
        return {
            total_submitted_amount: (0, helpers_1.roundCurrency)(totalSubmitted),
            total_covered_amount: (0, helpers_1.roundCurrency)(totalCovered),
            total_member_pays: (0, helpers_1.roundCurrency)(totalMemberPays),
            remaining_annual_limit_by_benefit: { ...state.remainingAnnualLimits },
            remaining_deductible_amount: (0, helpers_1.roundCurrency)(Math.max(0, policy.deductible.amount - state.accumulatedDeductiblePaid)),
        };
    }
}
exports.BenefitsCalculator = BenefitsCalculator;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExclusion = checkExclusion;
exports.checkWaitingPeriod = checkWaitingPeriod;
exports.applyDeductible = applyDeductible;
exports.applyPerVisitSubLimit = applyPerVisitSubLimit;
exports.applyCopay = applyCopay;
exports.applyAnnualLimitCap = applyAnnualLimitCap;
exports.determineDecision = determineDecision;
const helpers_1 = require("../utils/helpers");
/**
 * Rule 1: Reject expenses matching policy exclusions (sub-benefit or diagnosis).
 */
function checkExclusion(policy, expense) {
    const exclusions = policy.exclusions ?? [];
    for (const exclusion of exclusions) {
        const normalized = exclusion.toLowerCase();
        if (expense.sub_benefit.toLowerCase().includes(normalized) ||
            expense.diagnosis.toLowerCase().includes(normalized)) {
            return {
                denied: true,
                reason: `Expense denied: "${exclusion}" is excluded from coverage.`,
            };
        }
    }
    return { denied: false };
}
/**
 * Rule 2: Reject expenses submitted before the waiting period elapses.
 */
function checkWaitingPeriod(policy, expense, subBenefit) {
    const daysSinceEffective = (0, helpers_1.daysBetween)(policy.effective_date, expense.date);
    if (daysSinceEffective < subBenefit.waiting_period_days) {
        return {
            denied: true,
            reason: `Expense denied: within ${subBenefit.waiting_period_days}-day waiting period (${daysSinceEffective} days since policy effective date).`,
        };
    }
    return { denied: false };
}
/**
 * Rule 3: Apply annual deductible before insurance coverage begins.
 */
function applyDeductible(policy, expense, submittedAmount, accumulatedDeductiblePaid) {
    const { deductible } = policy;
    if (!deductible.applies_to.includes(expense.benefit_type)) {
        return {
            amountAfterDeductible: submittedAmount,
            deductibleApplied: 0,
        };
    }
    const remainingDeductible = Math.max(0, deductible.amount - accumulatedDeductiblePaid);
    if (remainingDeductible === 0) {
        return {
            amountAfterDeductible: submittedAmount,
            deductibleApplied: 0,
        };
    }
    const deductibleApplied = Math.min(submittedAmount, remainingDeductible);
    const amountAfterDeductible = submittedAmount - deductibleApplied;
    return {
        amountAfterDeductible,
        deductibleApplied,
        reason: deductibleApplied > 0
            ? `Deductible applied: ${deductibleApplied} THB member responsibility before coverage.`
            : undefined,
    };
}
/**
 * Rule 4: Cap eligible amount to the per-visit sub-limit.
 */
function applyPerVisitSubLimit(amountAfterDeductible, perVisitLimit) {
    if (amountAfterDeductible <= perVisitLimit) {
        return {
            eligibleAmount: amountAfterDeductible,
            excessAmount: 0,
        };
    }
    const excessAmount = amountAfterDeductible - perVisitLimit;
    return {
        eligibleAmount: perVisitLimit,
        excessAmount,
        reason: `Per-visit sub-limit of ${perVisitLimit} THB applied; ${excessAmount} THB exceeds visit cap.`,
    };
}
/**
 * Rule 5: Apply percentage or fixed copay to the eligible amount.
 */
function applyCopay(eligibleAmount, copay) {
    if (eligibleAmount === 0) {
        return { coveredAmount: 0, copayAmount: 0 };
    }
    if (copay.type === "PERCENTAGE") {
        const copayAmount = (0, helpers_1.roundCurrency)(eligibleAmount * (copay.percentage / 100));
        const coveredAmount = (0, helpers_1.roundCurrency)(eligibleAmount - copayAmount);
        return {
            coveredAmount,
            copayAmount,
            reason: `${copay.percentage}% copay applied. Covered: ${coveredAmount} THB. Member copay: ${copayAmount} THB.`,
        };
    }
    const copayAmount = (0, helpers_1.roundCurrency)(Math.min(copay.amount, eligibleAmount));
    const coveredAmount = (0, helpers_1.roundCurrency)(eligibleAmount - copayAmount);
    return {
        coveredAmount,
        copayAmount,
        reason: copayAmount > 0
            ? `Fixed copay of ${copayAmount} THB applied.`
            : "No copay applied.",
    };
}
/**
 * Rule 6: Cap insurer payment by the remaining annual benefit limit.
 */
function applyAnnualLimitCap(coveredAmount, remainingAnnualLimit) {
    if (coveredAmount <= remainingAnnualLimit) {
        return {
            coveredAmount,
            cappedAmount: 0,
        };
    }
    const cappedAmount = (0, helpers_1.roundCurrency)(coveredAmount - remainingAnnualLimit);
    return {
        coveredAmount: (0, helpers_1.roundCurrency)(remainingAnnualLimit),
        cappedAmount,
        reason: `Annual limit cap applied; ${cappedAmount} THB exceeds remaining annual balance of ${remainingAnnualLimit} THB.`,
    };
}
/**
 * Rule 7: Determine final decision from submitted vs covered amounts.
 */
function determineDecision(submittedAmount, coveredAmount, forceDenied) {
    if (forceDenied || coveredAmount === 0) {
        return "DENIED";
    }
    if (coveredAmount < submittedAmount) {
        return "PARTIALLY_COVERED";
    }
    return "COVERED";
}

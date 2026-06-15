"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.validatePolicy = validatePolicy;
exports.validateExpenses = validateExpenses;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
/**
 * Validates policy structure before calculation.
 */
function validatePolicy(policy) {
    if (!policy.policy_id) {
        throw new ValidationError("Policy must have a policy_id.");
    }
    if (!policy.effective_date || !policy.expiry_date) {
        throw new ValidationError("Policy must have effective_date and expiry_date.");
    }
    if (!policy.benefits || Object.keys(policy.benefits).length === 0) {
        throw new ValidationError("Policy must define at least one benefit type.");
    }
    if (!policy.deductible || policy.deductible.amount < 0) {
        throw new ValidationError("Policy must define a valid deductible.");
    }
}
/**
 * Validates expense list before calculation.
 */
function validateExpenses(expenses) {
    if (!expenses || expenses.length === 0) {
        throw new ValidationError("At least one expense is required.");
    }
    for (const expense of expenses) {
        if (!expense.expense_id) {
            throw new ValidationError("Each expense must have an expense_id.");
        }
        if (!expense.date) {
            throw new ValidationError(`Expense ${expense.expense_id} must have a date.`);
        }
        if (expense.amount < 0) {
            throw new ValidationError(`Expense ${expense.expense_id} amount cannot be negative.`);
        }
    }
}

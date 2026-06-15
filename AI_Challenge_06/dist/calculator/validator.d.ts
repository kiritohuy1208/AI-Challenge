import type { Policy } from "../types/policy";
import type { Expense } from "../types/expense";
export declare class ValidationError extends Error {
    constructor(message: string);
}
/**
 * Validates policy structure before calculation.
 */
export declare function validatePolicy(policy: Policy): void;
/**
 * Validates expense list before calculation.
 */
export declare function validateExpenses(expenses: Expense[]): void;

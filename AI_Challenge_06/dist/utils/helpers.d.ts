import type { Expense } from "../types/expense";
/**
 * Returns the number of whole days between two YYYY-MM-DD dates.
 * A same-day visit returns 0; the day after effective_date returns 1.
 */
export declare function daysBetween(startDate: string, endDate: string): number;
/**
 * Clones and sorts expenses chronologically by date ascending.
 */
export declare function sortExpensesByDate(expenses: Expense[]): Expense[];
/**
 * Rounds currency values to two decimal places.
 */
export declare function roundCurrency(value: number): number;

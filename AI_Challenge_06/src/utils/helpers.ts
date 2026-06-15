import type { Expense } from "../types/expense";

/**
 * Returns the number of whole days between two YYYY-MM-DD dates.
 * A same-day visit returns 0; the day after effective_date returns 1.
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Clones and sorts expenses chronologically by date ascending.
 */
export function sortExpensesByDate(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Rounds currency values to two decimal places.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

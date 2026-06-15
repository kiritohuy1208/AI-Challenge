"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysBetween = daysBetween;
exports.sortExpensesByDate = sortExpensesByDate;
exports.roundCurrency = roundCurrency;
/**
 * Returns the number of whole days between two YYYY-MM-DD dates.
 * A same-day visit returns 0; the day after effective_date returns 1.
 */
function daysBetween(startDate, endDate) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}
/**
 * Clones and sorts expenses chronologically by date ascending.
 */
function sortExpensesByDate(expenses) {
    return [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
/**
 * Rounds currency values to two decimal places.
 */
function roundCurrency(value) {
    return Math.round(value * 100) / 100;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResultLine = formatResultLine;
exports.formatSummary = formatSummary;
/**
 * Formats a single calculation result as a readable summary line.
 */
function formatResultLine(result) {
    return `[${result.expense_id}] ${result.decision}: covered ${result.covered_amount}, member pays ${result.member_pays} — ${result.reason}`;
}
/**
 * Formats the final summary as a readable block.
 */
function formatSummary(summary) {
    const benefitLines = Object.entries(summary.remaining_annual_limit_by_benefit)
        .map(([benefit, limit]) => `  ${benefit}: ${limit}`)
        .join("\n");
    return [
        `Total submitted: ${summary.total_submitted_amount}`,
        `Total covered: ${summary.total_covered_amount}`,
        `Total member pays: ${summary.total_member_pays}`,
        `Remaining deductible: ${summary.remaining_deductible_amount}`,
        "Remaining annual limits:",
        benefitLines,
    ].join("\n");
}

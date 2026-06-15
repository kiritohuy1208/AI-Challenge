/**
 * Submitted claim expense item.
 */
export interface Expense {
    expense_id: string;
    date: string;
    benefit_type: string;
    sub_benefit: string;
    amount: number;
    diagnosis: string;
    provider: string;
}

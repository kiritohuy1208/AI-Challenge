/**
 * Copay rule: percentage-based or fixed amount.
 */
export type CopayRule =
  | {
      type: "PERCENTAGE";
      percentage: number;
    }
  | {
      type: "FIXED";
      amount: number;
    };

/**
 * Sub-benefit level policy rules for each visit.
 */
export interface SubBenefitPolicy {
  per_visit_limit: number;
  copay: CopayRule;
  waiting_period_days: number;
}

/**
 * Benefit-level policy rule set (e.g., OUTPATIENT, INPATIENT).
 */
export interface BenefitPolicy {
  annual_limit: number;
  sub_benefits: Record<string, SubBenefitPolicy>;
}

/**
 * Deductible configuration applied across selected benefit types.
 */
export interface DeductiblePolicy {
  amount: number;
  applies_to: string[];
}

/**
 * Full insurance policy input model for the calculator.
 */
export interface Policy {
  policy_id: string;
  effective_date: string;
  expiry_date: string;
  currency: string;
  benefits: Record<string, BenefitPolicy>;
  deductible: DeductiblePolicy;
  exclusions?: string[];
}

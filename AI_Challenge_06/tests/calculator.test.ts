import { BenefitsCalculator } from "../src/calculator";
import {
  createExpense,
  createPolicy,
  noCopayNoDeductiblePolicy,
} from "./fixtures/test-data";

describe("BenefitsCalculator", () => {
  const calculator = new BenefitsCalculator();

  it("covers a normal expense at 100% when no copay, deductible, or caps apply", () => {
    const policy = noCopayNoDeductiblePolicy();
    const expenses = [
      createExpense({
        expense_id: "EXP-NORMAL",
        date: "2024-03-01",
        amount: 1_500,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);
    const result = results[0];

    expect(result.decision).toBe("COVERED");
    expect(result.covered_amount).toBe(1_500);
    expect(result.copay_amount).toBe(0);
    expect(result.member_pays).toBe(0);
    expect(result.remaining_annual_limit).toBe(98_500);
  });

  it("denies an expense submitted within the waiting period", () => {
    const policy = createPolicy({
      benefits: {
        OUTPATIENT: {
          annual_limit: 100_000,
          sub_benefits: {
            "Doctor Visit": {
              per_visit_limit: 3_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 30,
            },
          },
        },
      },
    });
    const expenses = [
      createExpense({
        expense_id: "EXP-WAIT",
        date: "2024-01-15",
        amount: 1_200,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].decision).toBe("DENIED");
    expect(results[0].covered_amount).toBe(0);
    expect(results[0].member_pays).toBe(1_200);
    expect(results[0].reason).toContain("waiting period");
  });

  it("applies deductible correctly across the first two expenses", () => {
    const policy = createPolicy({
      deductible: { amount: 2_000, applies_to: ["OUTPATIENT"] },
      benefits: {
        OUTPATIENT: {
          annual_limit: 100_000,
          sub_benefits: {
            "Doctor Visit": {
              per_visit_limit: 5_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 0,
            },
          },
        },
      },
    });
    const expenses = [
      createExpense({
        expense_id: "EXP-DED-1",
        date: "2024-02-01",
        amount: 1_500,
      }),
      createExpense({
        expense_id: "EXP-DED-2",
        date: "2024-02-10",
        amount: 1_700,
      }),
    ];

    const { results, summary } = calculator.processExpenses(policy, expenses);

    expect(results[0].covered_amount).toBe(0);
    expect(results[0].member_pays).toBe(1_500);
    expect(results[0].reason).toContain("Deductible");

    expect(results[1].covered_amount).toBe(1_200);
    expect(results[1].member_pays).toBe(500);
    expect(results[1].reason).toContain("Deductible");

    expect(summary.remaining_deductible_amount).toBe(0);
  });

  it("applies 20% copay to the eligible amount", () => {
    const policy = createPolicy({
      deductible: { amount: 0, applies_to: [] },
    });
    const expenses = [
      createExpense({
        expense_id: "EXP-COPAY",
        date: "2024-03-15",
        amount: 2_500,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].decision).toBe("PARTIALLY_COVERED");
    expect(results[0].covered_amount).toBe(2_000);
    expect(results[0].copay_amount).toBe(500);
    expect(results[0].member_pays).toBe(500);
    expect(results[0].reason).toContain("20% copay");
  });

  it("reduces coverage when expense exceeds the per-visit sub-limit", () => {
    const policy = createPolicy({
      deductible: { amount: 0, applies_to: [] },
    });
    const expenses = [
      createExpense({
        expense_id: "EXP-SUBLIMIT",
        date: "2024-03-10",
        amount: 4_200,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].decision).toBe("PARTIALLY_COVERED");
    expect(results[0].covered_amount).toBe(2_400);
    expect(results[0].member_pays).toBe(1_800);
    expect(results[0].reason).toContain("Per-visit sub-limit");
  });

  it("fully exhausts the annual limit on a single expense", () => {
    const policy = noCopayNoDeductiblePolicy();
    policy.benefits.OUTPATIENT.annual_limit = 3_000;

    const expenses = [
      createExpense({
        expense_id: "EXP-EXHAUST",
        date: "2024-04-01",
        amount: 3_000,
      }),
    ];

    const { results, summary } = calculator.processExpenses(policy, expenses);

    expect(results[0].covered_amount).toBe(3_000);
    expect(results[0].remaining_annual_limit).toBe(0);
    expect(summary.remaining_annual_limit_by_benefit.OUTPATIENT).toBe(0);
  });

  it("denies an expense submitted after the annual limit is already zero", () => {
    const policy = noCopayNoDeductiblePolicy();
    policy.benefits.OUTPATIENT.annual_limit = 2_000;

    const expenses = [
      createExpense({
        expense_id: "EXP-FIRST",
        date: "2024-04-01",
        amount: 2_000,
      }),
      createExpense({
        expense_id: "EXP-AFTER-ZERO",
        date: "2024-04-15",
        amount: 1_500,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].remaining_annual_limit).toBe(0);
    expect(results[1].decision).toBe("DENIED");
    expect(results[1].covered_amount).toBe(0);
    expect(results[1].member_pays).toBe(1_500);
    expect(results[1].reason).toContain("Annual limit");
  });

  it("processes expenses in chronological order even when input is shuffled", () => {
    const policy = createPolicy({
      deductible: { amount: 1_000, applies_to: ["OUTPATIENT"] },
      benefits: {
        OUTPATIENT: {
          annual_limit: 100_000,
          sub_benefits: {
            "Doctor Visit": {
              per_visit_limit: 5_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 0,
            },
          },
        },
      },
    });

    const earlier = createExpense({
      expense_id: "EXP-EARLIER",
      date: "2024-02-01",
      amount: 600,
    });
    const later = createExpense({
      expense_id: "EXP-LATER",
      date: "2024-03-01",
      amount: 600,
    });

    const shuffled = calculator.processExpenses(policy, [later, earlier]);
    const ordered = calculator.processExpenses(policy, [earlier, later]);

    expect(shuffled.results.map((r) => r.expense_id)).toEqual([
      "EXP-EARLIER",
      "EXP-LATER",
    ]);
    expect(shuffled.results).toEqual(ordered.results);
    expect(shuffled.summary).toEqual(ordered.summary);
  });

  it("denies an expense that matches a policy exclusion", () => {
    const policy = createPolicy({
      exclusions: ["Dental"],
      benefits: {
        OUTPATIENT: {
          annual_limit: 100_000,
          sub_benefits: {
            "Dental": {
              per_visit_limit: 3_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 0,
            },
          },
        },
      },
    });
    const expenses = [
      createExpense({
        expense_id: "EXP-EXCL",
        date: "2024-03-01",
        sub_benefit: "Dental",
        amount: 1_500,
        diagnosis: "Tooth extraction",
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].decision).toBe("DENIED");
    expect(results[0].covered_amount).toBe(0);
    expect(results[0].reason).toContain("excluded");
  });

  it("partially covers when annual limit caps the insurer payment mid-stream", () => {
    const policy = noCopayNoDeductiblePolicy();
    policy.benefits.OUTPATIENT.annual_limit = 5_000;
    policy.benefits.OUTPATIENT.sub_benefits["Doctor Visit"].per_visit_limit =
      10_000;

    const expenses = [
      createExpense({
        expense_id: "EXP-PARTIAL-CAP",
        date: "2024-05-01",
        amount: 7_000,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].decision).toBe("PARTIALLY_COVERED");
    expect(results[0].covered_amount).toBe(5_000);
    expect(results[0].member_pays).toBe(2_000);
    expect(results[0].reason).toContain("Annual limit cap");
  });

  it("aggregates totals correctly in the final summary", () => {
    const policy = createPolicy({
      deductible: { amount: 0, applies_to: [] },
    });
    const expenses = [
      createExpense({ expense_id: "EXP-S1", date: "2024-03-01", amount: 2_500 }),
      createExpense({ expense_id: "EXP-S2", date: "2024-03-10", amount: 1_000 }),
    ];

    const { summary } = calculator.processExpenses(policy, expenses);

    expect(summary.total_submitted_amount).toBe(3_500);
    expect(summary.total_covered_amount).toBe(2_800);
    expect(summary.total_member_pays).toBe(700);
  });

  it("keeps annual limit pools independent per benefit_type", () => {
    const policy = createPolicy({
      deductible: { amount: 0, applies_to: [] },
      benefits: {
        OUTPATIENT: {
          annual_limit: 100_000,
          sub_benefits: {
            "Doctor Visit": {
              per_visit_limit: 3_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 0,
            },
          },
        },
        INPATIENT: {
          annual_limit: 5_000,
          sub_benefits: {
            Hospitalization: {
              per_visit_limit: 20_000,
              copay: { type: "FIXED", amount: 0 },
              waiting_period_days: 0,
            },
          },
        },
      },
    });

    const expenses = [
      createExpense({
        expense_id: "EXP-IN",
        date: "2024-06-01",
        benefit_type: "INPATIENT",
        sub_benefit: "Hospitalization",
        amount: 5_000,
      }),
      createExpense({
        expense_id: "EXP-OUT",
        date: "2024-06-02",
        amount: 2_000,
      }),
    ];

    const { results, summary } = calculator.processExpenses(policy, expenses);

    expect(results[0].remaining_annual_limit).toBe(0);
    expect(results[1].remaining_annual_limit).toBe(98_000);
    expect(summary.remaining_annual_limit_by_benefit.INPATIENT).toBe(0);
    expect(summary.remaining_annual_limit_by_benefit.OUTPATIENT).toBe(98_000);
  });

  it("always reports remaining_visit_limit as the policy default for the next visit", () => {
    const policy = createPolicy({ deductible: { amount: 0, applies_to: [] } });
    const expenses = [
      createExpense({
        expense_id: "EXP-OVER",
        date: "2024-03-10",
        amount: 4_200,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].remaining_visit_limit).toBe(3_000);
  });

  it("balances member_pays exactly as submitted_amount minus covered_amount on annual cap", () => {
    const policy = createPolicy({
      deductible: { amount: 0, applies_to: [] },
      benefits: {
        INPATIENT: {
          annual_limit: 14_200,
          sub_benefits: {
            Hospitalization: {
              per_visit_limit: 20_000,
              copay: { type: "PERCENTAGE", percentage: 10 },
              waiting_period_days: 0,
            },
          },
        },
      },
    });

    const expenses = [
      createExpense({
        expense_id: "EXP-CAP",
        date: "2024-06-08",
        benefit_type: "INPATIENT",
        sub_benefit: "Hospitalization",
        amount: 18_000,
      }),
    ];

    const { results } = calculator.processExpenses(policy, expenses);

    expect(results[0].covered_amount).toBe(14_200);
    expect(results[0].member_pays).toBe(3_800);
    expect(results[0].submitted_amount - results[0].covered_amount).toBe(
      results[0].member_pays
    );
  });
});

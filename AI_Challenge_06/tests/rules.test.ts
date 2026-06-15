import {
  applyAnnualLimitCap,
  applyCopay,
  applyDeductible,
  applyPerVisitSubLimit,
  checkExclusion,
  checkWaitingPeriod,
  determineDecision,
} from "../src/calculator/rules";
import { createExpense, createPolicy } from "./fixtures/test-data";

describe("Business rule helpers", () => {
  const policy = createPolicy();
  const subBenefit = policy.benefits.OUTPATIENT.sub_benefits["Doctor Visit"];

  it("checkExclusion denies matching sub-benefit names", () => {
    const expense = createExpense({ sub_benefit: "Dental Care" });
    const result = checkExclusion(
      createPolicy({ exclusions: ["Dental"] }),
      expense
    );

    expect(result.denied).toBe(true);
    expect(result.reason).toContain("Dental");
  });

  it("checkWaitingPeriod denies visits before the waiting period ends", () => {
    const expense = createExpense({ date: "2024-01-10" });
    const result = checkWaitingPeriod(policy, expense, {
      ...subBenefit,
      waiting_period_days: 30,
    });

    expect(result.denied).toBe(true);
  });

  it("applyDeductible consumes expense amount before coverage begins", () => {
    const expense = createExpense({ amount: 1_500 });
    const result = applyDeductible(
      createPolicy({
        deductible: { amount: 2_000, applies_to: ["OUTPATIENT"] },
      }),
      expense,
      1_500,
      0
    );

    expect(result.deductibleApplied).toBe(1_500);
    expect(result.amountAfterDeductible).toBe(0);
  });

  it("applyPerVisitSubLimit caps eligible amount to the visit limit", () => {
    const result = applyPerVisitSubLimit(4_200, 3_000);

    expect(result.eligibleAmount).toBe(3_000);
    expect(result.excessAmount).toBe(1_200);
  });

  it("applyCopay calculates percentage-based member share", () => {
    const result = applyCopay(2_500, { type: "PERCENTAGE", percentage: 20 });

    expect(result.coveredAmount).toBe(2_000);
    expect(result.copayAmount).toBe(500);
  });

  it("applyAnnualLimitCap reduces covered amount to remaining balance", () => {
    const result = applyAnnualLimitCap(8_000, 5_000);

    expect(result.coveredAmount).toBe(5_000);
    expect(result.cappedAmount).toBe(3_000);
  });

  it("determineDecision returns the correct status label", () => {
    expect(determineDecision(1_000, 1_000, false)).toBe("COVERED");
    expect(determineDecision(1_000, 500, false)).toBe("PARTIALLY_COVERED");
    expect(determineDecision(1_000, 0, false)).toBe("DENIED");
    expect(determineDecision(1_000, 500, true)).toBe("DENIED");
  });
});

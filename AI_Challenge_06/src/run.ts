import * as fs from "fs";
import * as path from "path";
import { BenefitsCalculator } from "./calculator";
import type { Policy } from "./types/policy";
import type { Expense } from "./types/expense";

const dataDir = path.join(__dirname, "data");
const outputDir = path.join(__dirname, "..", "output");

const policy: Policy = JSON.parse(
  fs.readFileSync(path.join(dataDir, "policy.json"), "utf-8")
);
const expenses: Expense[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, "expenses.json"), "utf-8")
);

const calculator = new BenefitsCalculator();
const { results, summary } = calculator.processExpenses(policy, expenses);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, "results.json"),
  JSON.stringify(results, null, 2)
);
fs.writeFileSync(
  path.join(outputDir, "summary.json"),
  JSON.stringify(summary, null, 2)
);

console.log(`Processed ${results.length} expenses.`);
console.log(`Results written to ${outputDir}`);

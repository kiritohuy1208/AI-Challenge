"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const calculator_1 = require("./calculator");
const dataDir = path.join(__dirname, "data");
const outputDir = path.join(__dirname, "..", "output");
const policy = JSON.parse(fs.readFileSync(path.join(dataDir, "policy.json"), "utf-8"));
const expenses = JSON.parse(fs.readFileSync(path.join(dataDir, "expenses.json"), "utf-8"));
const calculator = new calculator_1.BenefitsCalculator();
const { results, summary } = calculator.processExpenses(policy, expenses);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(path.join(outputDir, "results.json"), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(`Processed ${results.length} expenses.`);
console.log(`Results written to ${outputDir}`);

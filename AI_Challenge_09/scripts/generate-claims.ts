import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICD10_CODES } from '../src/data/icd10-codes.ts';

const ROW_COUNT = 5000;
const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'claims.csv',
);

const CLAIM_TYPES = ['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY'] as const;
const CLAIM_TYPE_WEIGHTS = [0.62, 0.18, 0.12, 0.08];

const STATUSES = ['APPROVED', 'REJECTED', 'PENDING', 'IN_REVIEW'] as const;
type ClaimStatus = (typeof STATUSES)[number];
type ClaimType = (typeof CLAIM_TYPES)[number];

const ASSESSORS = [
  'Sarah Chen',
  'Michael Wong',
  'Priya Sharma',
  'James Tan',
  'Emily Nguyen',
];

const INSURERS = ['Pacific Shield Insurance', 'Meridian Health Assurance', 'EastAsia Mutual'];

const COUNTRIES = ['Thailand', 'Vietnam', 'Hong Kong'] as const;

const FIRST_NAMES = [
  'Ananya', 'Somchai', 'Minh', 'Lan', 'Wei', 'Mei', 'Arun', 'Siti', 'David', 'Grace',
  'Hoang', 'Priya', 'Kenji', 'Nisha', 'Carlos', 'Yuki', 'Fatima', 'Oliver', 'Hana', 'Raj',
];

const LAST_NAMES = [
  'Nguyen', 'Wong', 'Patel', 'Kim', 'Tanaka', 'Silva', 'Chen', 'Kumar', 'Lee', 'Tran',
  'Sato', 'Pham', 'Lim', 'Singh', 'Ho', 'Park', 'Ali', 'Brown', 'Yamamoto', 'Gupta',
];

const CSV_HEADERS = [
  'claim_id',
  'policy_id',
  'member_name',
  'claim_type',
  'diagnosis_icd10',
  'submitted_amount',
  'approved_amount',
  'status',
  'submitted_date',
  'processed_date',
  'assessor',
  'insurer',
  'country',
] as const;

function weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;

  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) {
      return items[index];
    }
  }

  return items[items.length - 1];
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function padId(prefix: string, value: number, width: number): string {
  return `${prefix}${String(value).padStart(width, '0')}`;
}

function skewedSubmittedAmount(): number {
  const min = 500;
  const max = 2_000_000;
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const skew = Math.pow(Math.random(), 2.4);
  return Math.round(Math.exp(logMin + skew * (logMax - logMin)));
}

function pickStatus(): ClaimStatus {
  const roll = Math.random();
  if (roll < 0.15) return 'REJECTED';
  if (roll < 0.7) return 'APPROVED';
  if (roll < 0.85) return 'IN_REVIEW';
  return 'PENDING';
}

function pickProcessingDays(): number {
  const weights = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    return Math.exp(-((day - 7) ** 2) / 18);
  });
  return weightedPick(
    weights.map((_, index) => index + 1),
    weights,
  );
}

function approvedAmount(status: ClaimStatus, submitted: number): number {
  if (status === 'REJECTED') {
    return 0;
  }

  if (status === 'APPROVED') {
    const ratio = 0.85 + Math.random() * 0.15;
    return Math.min(submitted, Math.round(submitted * ratio));
  }

  if (status === 'PENDING') {
    if (Math.random() < 0.6) {
      return 0;
    }
    const ratio = 0.25 + Math.random() * 0.45;
    return Math.min(submitted, Math.round(submitted * ratio));
  }

  const ratio = 0.45 + Math.random() * 0.4;
  return Math.min(submitted, Math.round(submitted * ratio));
}

function randomSubmittedDate2024(): Date {
  const start = Date.UTC(2024, 0, 1);
  const end = Date.UTC(2024, 11, 31, 23, 59, 59, 999);
  return new Date(start + Math.random() * (end - start));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function processedDateForStatus(status: ClaimStatus, submittedDate: Date): string | null {
  if (status === 'PENDING') {
    return null;
  }

  return formatDate(addDays(submittedDate, pickProcessingDays()));
}

function memberName(): string {
  return `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
}

function escapeCsv(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

interface GeneratedClaim {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: ClaimType;
  diagnosis_icd10: string;
  submitted_amount: number;
  approved_amount: number;
  status: ClaimStatus;
  submitted_date: string;
  processed_date: string | null;
  assessor: string;
  insurer: string;
  country: (typeof COUNTRIES)[number];
}

function generateClaim(index: number): GeneratedClaim {
  const status = pickStatus();
  const submittedAmount = skewedSubmittedAmount();
  const submittedDate = randomSubmittedDate2024();

  return {
    claim_id: padId('CLM-', index, 5),
    policy_id: padId('POL-', index, 5),
    member_name: memberName(),
    claim_type: weightedPick(CLAIM_TYPES, CLAIM_TYPE_WEIGHTS),
    diagnosis_icd10: pickRandom(ICD10_CODES),
    submitted_amount: submittedAmount,
    approved_amount: approvedAmount(status, submittedAmount),
    status,
    submitted_date: formatDate(submittedDate),
    processed_date: processedDateForStatus(status, submittedDate),
    assessor: pickRandom(ASSESSORS),
    insurer: pickRandom(INSURERS),
    country: pickRandom(COUNTRIES),
  };
}

function claimToCsvRow(claim: GeneratedClaim): string {
  return [
    claim.claim_id,
    claim.policy_id,
    claim.member_name,
    claim.claim_type,
    claim.diagnosis_icd10,
    claim.submitted_amount,
    claim.approved_amount,
    claim.status,
    claim.submitted_date,
    claim.processed_date,
    claim.assessor,
    claim.insurer,
    claim.country,
  ]
    .map((value) => escapeCsv(value))
    .join(',');
}

function validateClaims(claims: GeneratedClaim[]): void {
  if (claims.length !== ROW_COUNT) {
    throw new Error(`Expected ${ROW_COUNT} rows, got ${claims.length}`);
  }

  const rejected = claims.filter((claim) => claim.status === 'REJECTED');
  const pending = claims.filter((claim) => claim.status === 'PENDING');
  const rejectionRate = rejected.length / claims.length;
  const outpatientRate =
    claims.filter((claim) => claim.claim_type === 'OUTPATIENT').length / claims.length;

  const invalidRejectedAmount = rejected.filter((claim) => claim.approved_amount !== 0);
  const invalidPendingDates = pending.filter((claim) => claim.processed_date !== null);
  const invalidNonPendingDates = claims
    .filter((claim) => claim.status !== 'PENDING')
    .filter((claim) => claim.processed_date === null);
  const invalidApprovedAmount = claims.filter(
    (claim) => claim.approved_amount > claim.submitted_amount,
  );

  const processingDays = claims
    .filter((claim) => claim.processed_date !== null)
    .map((claim) => {
      const submitted = new Date(claim.submitted_date);
      const processed = new Date(claim.processed_date!);
      return Math.round((processed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
    });

  const avgProcessingDays =
    processingDays.reduce((sum, days) => sum + days, 0) / processingDays.length;

  if (invalidRejectedAmount.length > 0) {
    throw new Error('REJECTED claims must have approved_amount = 0');
  }

  if (invalidPendingDates.length > 0) {
    throw new Error('PENDING claims must have null processed_date');
  }

  if (invalidNonPendingDates.length > 0) {
    throw new Error('Non-PENDING claims must have processed_date set');
  }

  if (invalidApprovedAmount.length > 0) {
    throw new Error('approved_amount must be <= submitted_amount');
  }

  console.log('Dataset validation summary:');
  console.log(`- Rows: ${claims.length}`);
  console.log(`- Rejection rate: ${(rejectionRate * 100).toFixed(1)}% (target ~15%)`);
  console.log(`- Outpatient share: ${(outpatientRate * 100).toFixed(1)}% (target majority)`);
  console.log(`- Avg processing days: ${avgProcessingDays.toFixed(1)} (target ~7)`);
}

function main(): void {
  const claims = Array.from({ length: ROW_COUNT }, (_, index) => generateClaim(index + 1));
  validateClaims(claims);

  const csv = [CSV_HEADERS.join(','), ...claims.map(claimToCsvRow)].join('\n');
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${csv}\n`, 'utf8');

  console.log(`Wrote ${ROW_COUNT} claims to ${OUTPUT_PATH}`);
}

main();

import { format } from 'date-fns';
import Papa from 'papaparse';

import type { Claim, ClaimCsvRow } from '../types/claim';

export function claimsToExportRows(claims: Claim[]): ClaimCsvRow[] {
  return claims.map((claim) => ({
    claim_id: claim.claim_id,
    policy_id: claim.policy_id,
    member_name: claim.member_name,
    claim_type: claim.claim_type,
    diagnosis_icd10: claim.diagnosis_icd10,
    submitted_amount: String(claim.submitted_amount),
    approved_amount: String(claim.approved_amount),
    status: claim.status,
    submitted_date: format(claim.submitted_date, 'yyyy-MM-dd'),
    processed_date: claim.processed_date
      ? format(claim.processed_date, 'yyyy-MM-dd')
      : '',
    assessor: claim.assessor,
    insurer: claim.insurer,
    country: claim.country,
  }));
}

export function exportClaimsToCsv(
  claims: Claim[],
  filename = 'filtered-claims.csv',
): void {
  const rows = claimsToExportRows(claims);
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

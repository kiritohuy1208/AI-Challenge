export function isValidDateString(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value))
}

/** Local calendar date as YYYY-MM-DD (matches `<input type="date">` values). */
export function getTodayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const TREATMENT_DATE_FUTURE_ERROR = 'Treatment date cannot be in the future.'
export const ADMISSION_DATE_FUTURE_ERROR = 'Admission date cannot be in the future.'
export const DISCHARGE_DATE_FUTURE_ERROR = 'Discharge date cannot be in the future.'
export const DISCHARGE_BEFORE_ADMISSION_ERROR =
  'Discharge date cannot be before the admission date.'

export function isDateNotInFuture(value: string): boolean {
  if (!isValidDateString(value)) {
    return false
  }

  return value <= getTodayDateInputValue()
}

/** Compare YYYY-MM-DD strings — discharge must be on or after admission. */
export function isDischargeOnOrAfterAdmission(
  admissionDate: string,
  dischargeDate: string,
): boolean {
  if (!isValidDateString(admissionDate) || !isValidDateString(dischargeDate)) {
    return true
  }

  return dischargeDate >= admissionDate
}

/** Inclusive calendar days between admission and discharge (YYYY-MM-DD). */
export function calculateLengthOfStay(
  admissionDate: string,
  dischargeDate: string,
): number | null {
  if (!admissionDate || !dischargeDate) {
    return null
  }

  if (!isValidDateString(admissionDate) || !isValidDateString(dischargeDate)) {
    return null
  }

  if (!isDischargeOnOrAfterAdmission(admissionDate, dischargeDate)) {
    return null
  }

  const [admissionYear, admissionMonth, admissionDay] = admissionDate
    .split('-')
    .map(Number)
  const [dischargeYear, dischargeMonth, dischargeDay] = dischargeDate
    .split('-')
    .map(Number)

  const admission = new Date(admissionYear, admissionMonth - 1, admissionDay)
  const discharge = new Date(dischargeYear, dischargeMonth - 1, dischargeDay)

  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const difference = discharge.getTime() - admission.getTime()

  return Math.floor(difference / millisecondsPerDay) + 1
}

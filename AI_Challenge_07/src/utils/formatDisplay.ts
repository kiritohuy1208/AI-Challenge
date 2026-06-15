/** Format YYYY-MM-DD for summary display. */
export function formatDisplayDate(value: string): string {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return value
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formats a date string or ISO timestamp to MM/DD/YYYY (en-US).
 * Date-only strings (YYYY-MM-DD) are parsed as local time to avoid
 * UTC midnight timezone shift.
 */
export function formatDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T00:00:00')
    : new Date(value);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

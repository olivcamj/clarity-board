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

export type DueTone = 'overdue' | 'today' | 'upcoming' | 'none';

/**
 * Friendly relative label for a due date, e.g. "Overdue", "Due today",
 * "Due tomorrow", "Due Fri", or a full date once it's far enough out.
 */
export function relativeDueLabel(due?: string | null): { label: string; tone: DueTone } {
  if (!due) return { label: '', tone: 'none' };

  const date = /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due + 'T00:00:00') : new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return { label: 'Overdue', tone: 'overdue' };
  if (diffDays === 0) return { label: 'Due today', tone: 'today' };
  if (diffDays === 1) return { label: 'Due tomorrow', tone: 'upcoming' };
  if (diffDays < 7) return { label: `Due ${date.toLocaleDateString('en-US', { weekday: 'short' })}`, tone: 'upcoming' };
  return { label: `Due ${formatDate(due)}`, tone: 'upcoming' };
}

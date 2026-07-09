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

/**
 * Relative "time ago" label for a timestamp, e.g. "just now", "5m ago",
 * "3h ago", "yesterday", "4d ago", falling back to a short date past a week.
 */
export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

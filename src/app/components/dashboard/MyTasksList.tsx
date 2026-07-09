import Link from 'next/link';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { relativeDueLabel } from '../../lib/utils';
import type { Status, BadgeTone } from '../../types/task';

export interface MyTask {
  id: string;
  title: string;
  status: Status;
  due?: string | null;
  board: { id: string; name: string };
}

interface MyTasksListProps {
  tasks: MyTask[];
  onComplete: (taskId: string) => void;
  getBoardHref?: (boardId: string) => string;
  searchQuery?: string;
}

const STATUS_TONE: Record<Status, BadgeTone> = {
  todo: 'ghost',
  doing: 'info',
  review: 'warn',
  done: 'ok',
};

const STATUS_LABEL: Record<Status, string> = {
  todo: 'To do',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
};

const DUE_TEXT_CLASS: Record<string, string> = {
  overdue: 'text-rose',
  today: 'text-ember',
  upcoming: 'text-ash',
  none: 'text-ash',
};

export function MyTasksList({ tasks, onComplete, getBoardHref, searchQuery = '' }: MyTasksListProps) {
  const q = searchQuery.trim().toLowerCase();
  const visibleTasks = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.board.name.toLowerCase().includes(q))
    : tasks;

  return (
    <section>
      <div className="flex items-end justify-between mb-[14px]">
        <div>
          <p className="font-mono text-[10px] text-ember tracking-[0.1em] uppercase mb-[4px]">No. I</p>
          <h2 className="font-display text-[28px] font-normal text-ink m-0">
            What needs <em>you</em> today.
          </h2>
        </div>
        <div className="flex items-center gap-[8px]">
          <Button type="button" variant="ghost" size="sm">View all</Button>
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="font-ui text-[13px] text-ash italic py-[24px] text-center border border-chalk rounded-[10px]">
          {q ? 'No tasks match your search.' : 'Nothing on your plate right now.'}
        </p>
      ) : (
        <ul className="list-none m-0 p-0 border border-chalk rounded-[10px] divide-y divide-chalk overflow-hidden">
          {visibleTasks.map(task => {
            const due = relativeDueLabel(task.due);
            return (
              <li key={task.id} className="flex items-center gap-[12px] px-[16px] py-[12px] bg-paper">
                <Checkbox checked={false} onChange={() => onComplete(task.id)} />
                <Link
                  href={getBoardHref ? getBoardHref(task.board.id) : `/taskboard?boardId=${task.board.id}`}
                  className="flex-1 min-w-0 no-underline group"
                >
                  <span className="font-ui text-[13px] text-ink group-hover:text-slate transition-colors duration-150 truncate block">
                    {task.title}
                  </span>
                </Link>
                <Badge tone="slate" size="sm">{task.board.name}</Badge>
                <Badge tone={STATUS_TONE[task.status]} size="sm">{STATUS_LABEL[task.status]}</Badge>
                {due.label && (
                  <span className={`font-mono text-[11px] shrink-0 ${DUE_TEXT_CLASS[due.tone]}`}>
                    {due.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

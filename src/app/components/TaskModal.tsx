'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Task, Priority, Status } from '@/types/task';
import { LABELS, personName } from '@/data/labels';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';

export type ModalMode = 'view' | 'edit' | 'create';

export interface TaskModalProps {
  task?: Task;
  mode?: ModalMode;
  columnId?: string;
  onClose: () => void;
  onSave?: (task: Task) => void;
  onToggleSubtask?: (subtaskId: string) => void;
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string }> = {
  todo:   { label: 'To do',     dot: 'var(--chalk)' },
  doing:  { label: 'Doing',     dot: 'var(--slate)' },
  review: { label: 'In Review', dot: 'var(--ochre)' },
  done:   { label: 'Done',      dot: 'var(--sage)'  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  high: { label: 'High', dot: 'var(--rose)'  },
  med:  { label: 'Med',  dot: 'var(--ochre)' },
  low:  { label: 'Low',  dot: 'var(--smoke)' },
};

const SECTION_LABEL_CLS =
  'text-[10px] text-ash tracking-[0.08em] uppercase font-mono font-medium m-0';

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Attachment chips share a style that doesn't map to any Button variant —
// they're deliberately raw elements so Button's base classes don't interfere.
const CHIP_CLS =
  'inline-flex items-center gap-[6px] text-[12px] font-mono text-slate ' +
  'border border-chalk rounded-[8px] py-[6px] px-[11px] bg-bone ' +
  'cursor-pointer transition-[border-color] duration-150 hover:border-slate';

function MetaTerm({ children }: { children: ReactNode }) {
  return <dt className={`${SECTION_LABEL_CLS} mb-[6px]`}>{children}</dt>;
}

function MetaDetail({ children }: { children: ReactNode }) {
  return <dd className="m-0 mb-[20px]">{children}</dd>;
}

export function TaskModal({
  task,
  mode = 'view',
  onClose,
  onToggleSubtask,
}: TaskModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');

  // Focus management + scroll lock + Escape
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, []);

  // Focus trap
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab' || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleCommentSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // TODO: persist comment to backend
    setCommentText('');
  };

  if (!task && mode !== 'create') return null;

  const statusCfg   = task ? STATUS_CONFIG[task.status] : null;
  const priorityCfg = task ? PRIORITY_CONFIG[task.priority] : null;
  const doneSubs    = task?.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubs   = task?.subtasks?.length ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(31, 26, 21, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog positioner */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          ref={dialogRef}
          onKeyDown={handleKeyDown}
          className="bg-paper rounded-[16px] shadow-[var(--shadow-3)] flex w-full max-w-[920px] max-h-[90vh] overflow-hidden outline-none"
        >
          {/* ── Left panel ──────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-[36px] min-w-0">

            {/* Breadcrumb */}
            {task && statusCfg && (
              <p
                aria-label={`${task.id}, status: ${statusCfg.label}${task.sprint ? `, ${task.sprint}` : ''}`}
                className="flex items-center gap-[8px] mb-[14px] flex-wrap"
              >
                <span className="font-mono text-[11px] text-ash">{task.id}</span>
                <span aria-hidden="true" className="text-chalk">·</span>
                <span className="inline-flex items-center gap-[5px]">
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full inline-block shrink-0"
                    style={{ background: statusCfg.dot }}
                  />
                  <span className="font-ui text-[11px] text-soot">{statusCfg.label}</span>
                </span>
                {task.sprint && (
                  <>
                    <span aria-hidden="true" className="text-chalk">·</span>
                    <span className="font-ui text-[11px] text-ash">{task.sprint}</span>
                  </>
                )}
              </p>
            )}

            {/* Title */}
            <h1
              id="modal-title"
              className="font-display text-[34px] font-normal leading-[1.15] text-ink mb-[12px]"
            >
              {task?.title ?? 'New task'}
            </h1>

            {/* Description */}
            {task?.description && (
              <p className="text-[14px] text-soot leading-[1.6] mb-[32px]">
                {task.description}
              </p>
            )}

            {/* ── Subtasks ──────────────────────────────── */}
            <section aria-labelledby="subtasks-heading" className="mb-[32px]">
              <div className="flex items-center justify-between mb-[12px]">
                <h2 id="subtasks-heading" className={SECTION_LABEL_CLS}>
                  Subtasks{' '}
                  <span aria-live="polite">
                    {totalSubs > 0 ? `${doneSubs}/${totalSubs}` : '0/0'}
                  </span>
                </h2>
                <Button variant="outline" tone="ember" size="sm">
                  <Spark size={10} color="var(--ember)" />
                  Break down with Clarity
                </Button>
              </div>

              {totalSubs > 0 && (
                <ul className="list-none m-0 p-0 flex flex-col gap-[10px]">
                  {task!.subtasks!.map(s => (
                    <li key={s.id} className="flex items-center gap-[10px]">
                      <Checkbox
                        checked={s.done}
                        size={16}
                        onChange={() => onToggleSubtask?.(s.id)}
                      />
                      <span className={`text-[14px] font-ui ${s.done ? 'text-smoke line-through' : 'text-soot'}`}>
                        {s.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Button variant="ghost" size="sm" className="mt-[12px]">
                <Icon name="plus" size={13} color="var(--ash)" />
                Add subtask
              </Button>
            </section>

            {/* ── Attachments ──────────────────────────── */}
            {task?.attachments && task.attachments.length > 0 && (
              <section aria-labelledby="attachments-heading" className="mb-[32px]">
                <h2 id="attachments-heading" className={`${SECTION_LABEL_CLS} mb-[10px]`}>
                  Attachments
                </h2>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-[8px]">
                  {task.attachments.map((a, i) => (
                    <li key={`${a.label}-${i}`}>
                      {a.href ? (
                        <a
                          href={a.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${CHIP_CLS} no-underline`}
                        >
                          <Icon name="link" size={11} color="var(--slate)" />
                          {a.label}
                        </a>
                      ) : (
                        <button type="button" className={CHIP_CLS}>
                          <Icon name="attach" size={11} color="var(--slate)" />
                          {a.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Conversation ─────────────────────────── */}
            <section aria-labelledby="conversation-heading">
              <h2 id="conversation-heading" className={`${SECTION_LABEL_CLS} mb-[16px]`}>
                Conversation
              </h2>

              {task?.conversation && task.conversation.length > 0 && (
                <ol aria-label="Comments" className="list-none m-0 mb-[24px] p-0 flex flex-col gap-[22px]">
                  {task.conversation.map(comment => {
                    const isClarity = comment.isAI;
                    const name = isClarity ? 'Clarity' : personName(comment.authorId);
                    return (
                      <li key={comment.id} className="flex gap-[12px] items-start">
                        {isClarity ? (
                          <div
                            role="img"
                            aria-label="Clarity AI"
                            className="w-[32px] h-[32px] rounded-full shrink-0 bg-ember-soft border-[1.5px] border-ember flex items-center justify-center"
                          >
                            <Spark size={13} color="var(--ember)" />
                          </div>
                        ) : (
                          <Avatar name={name} size={32} />
                        )}

                        <article className="flex-1">
                          <header className="flex items-center gap-[8px] mb-[5px]">
                            <strong className="text-[13px] text-ink font-ui font-semibold">
                              {name}
                            </strong>
                            {isClarity && <Badge tone="ai" size="sm">AI</Badge>}
                            <time className="text-[11px] text-ash font-mono">
                              {comment.timestamp}
                            </time>
                          </header>
                          <p className={`text-[13px] leading-[1.55] m-0 font-ui ${isClarity ? 'text-ember italic' : 'text-soot'}`}>
                            {comment.text}
                          </p>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* Comment form */}
              <form
                onSubmit={handleCommentSubmit}
                className="border border-chalk rounded-[10px] bg-bone overflow-hidden"
              >
                <div className="flex items-start gap-[10px] px-[14px] py-[12px]">
                  <Avatar name="Mira Cho" size={28} />
                  <textarea
                    id="comment-input"
                    aria-label="Add a comment"
                    placeholder="Add a comment — @ to mention, / for commands"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={commentText ? 3 : 1}
                    className="flex-1 text-[13px] text-ink font-ui bg-transparent border-0 outline-none resize-none pt-1 leading-[1.5]"
                  />
                </div>
                <div className="flex items-center border-t border-chalk px-[14px] py-[8px] gap-[10px]">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Mention someone">
                    <Icon name="comment" size={14} color="var(--ash)" label="Mention" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach file">
                    <Icon name="attach" size={14} color="var(--ash)" label="Attach" />
                  </Button>
                  <div className="ml-auto flex items-center gap-[12px]">
                    <Button type="button" variant="ghost" tone="ember" size="sm">
                      <Spark size={10} color="var(--ember)" />
                      Draft with Clarity
                    </Button>
                    <Button type="submit" variant="solid" size="md" disabled={!commentText.trim()}>
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* ── Right panel ─────────────────────────────── */}
          <aside
            aria-label="Task details"
            className="w-[260px] shrink-0 border-l border-chalk py-[16px] px-[22px] overflow-y-auto"
          >
            {/* Toolbar: More + Close */}
            <div className="flex items-center justify-between mb-[24px]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="More options"
                aria-haspopup="menu"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ash)" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
                More
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close task"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Metadata */}
            <dl className="m-0 p-0">

              <MetaTerm>Assignees</MetaTerm>
              <MetaDetail>
                <ul className="list-none m-0 p-0 flex flex-col gap-[8px]">
                  {(task?.assignees ?? []).map(id => (
                    <li key={id} className="flex items-center gap-[9px]">
                      <Avatar name={personName(id)} size={24} />
                      <span className="text-[13px] text-soot font-ui">{personName(id)}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" className="mt-[8px]">
                  <Icon name="plus" size={12} color="var(--ash)" /> Add
                </Button>
              </MetaDetail>

              {priorityCfg && (
                <>
                  <MetaTerm>Priority</MetaTerm>
                  <MetaDetail>
                    <span className="inline-flex items-center gap-[7px]">
                      <span
                        aria-hidden="true"
                        className="w-[8px] h-[8px] rounded-full inline-block shrink-0"
                        style={{ background: priorityCfg.dot }}
                      />
                      <span className="text-[13px] text-soot font-ui">{priorityCfg.label}</span>
                    </span>
                  </MetaDetail>
                </>
              )}

              {task?.due && (
                <>
                  <MetaTerm>Due</MetaTerm>
                  <MetaDetail>
                    <time className="text-[13px] text-soot font-ui">{task.due}</time>
                  </MetaDetail>
                </>
              )}

              {task?.labels && task.labels.length > 0 && (
                <>
                  <MetaTerm>Labels</MetaTerm>
                  <MetaDetail>
                    <ul className="list-none m-0 p-0 flex flex-wrap gap-[6px]">
                      {task.labels.map(key => {
                        const def = LABELS[key];
                        return def ? (
                          <li key={key}><Badge tone={def.tone} size="sm">{def.name}</Badge></li>
                        ) : null;
                      })}
                    </ul>
                  </MetaDetail>
                </>
              )}

              {task?.sprint && (
                <>
                  <MetaTerm>Sprint</MetaTerm>
                  <MetaDetail>
                    <span className="text-[13px] text-soot font-ui">{task.sprint}</span>
                  </MetaDetail>
                </>
              )}

              {task?.createdAt && (
                <>
                  <MetaTerm>Created</MetaTerm>
                  <MetaDetail>
                    <span className="text-[13px] text-soot font-ui">
                      {task.createdAt}{task.createdBy ? ` by ${personName(task.createdBy)}` : ''}
                    </span>
                  </MetaDetail>
                </>
              )}

            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}

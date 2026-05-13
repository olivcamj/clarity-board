'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Task, Priority, Status, LabelKey } from '@/types/task';
import { LABELS, personName } from '@/data/labels';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';

export type ModalMode = 'view' | 'edit' | 'create';
export type ColumnOption = { id: string; name: string };

export interface TaskModalProps {
  task?: Task;
  mode?: ModalMode;
  columnId?: string;
  columnOptions?: ColumnOption[];
  onClose: () => void;
  onSave?: (task: Task) => void;
  onCreate?: (
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks'>,
    columnId: string
  ) => void;
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

const PRIORITY_ORDER: Priority[] = ['high', 'med', 'low'];
const ALL_LABEL_KEYS = Object.keys(LABELS) as LabelKey[];

const SECTION_LABEL_CLS =
  'text-[10px] text-ash tracking-[0.08em] uppercase font-mono font-medium m-0';

const CHIP_CLS =
  'inline-flex items-center gap-[6px] text-[12px] font-mono text-slate ' +
  'border border-chalk rounded-[8px] py-[6px] px-[11px] bg-bone ' +
  'cursor-pointer transition-[border-color] duration-150 hover:border-slate';

const FIELD_CLS =
  'text-[13px] text-ink font-ui bg-bone border border-chalk rounded-[6px] ' +
  'px-[8px] py-[4px] outline-none w-full transition-colors duration-150 focus:border-slate';

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function MetaTerm({ children }: { children: ReactNode }) {
  return <dt className={`${SECTION_LABEL_CLS} mb-[6px]`}>{children}</dt>;
}

function MetaDetail({ children }: { children: ReactNode }) {
  return <dd className="m-0 mb-[20px]">{children}</dd>;
}

function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {PRIORITY_ORDER.map(p => {
        const cfg = PRIORITY_CONFIG[p];
        const isSelected = value === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(p)}
            className={`inline-flex items-center gap-[6px] text-[12px] font-ui py-[3px] px-[10px] rounded-full border cursor-pointer transition-colors duration-150 ${
              isSelected
                ? 'border-slate bg-slate-soft text-slate-ink font-medium'
                : 'border-chalk bg-transparent text-ash hover:border-slate'
            }`}
          >
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: cfg.dot }} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

function LabelPicker({
  value,
  onChange,
}: {
  value: LabelKey[];
  onChange: (labels: LabelKey[]) => void;
}) {
  const toggle = (key: LabelKey) => {
    onChange(
      value.includes(key) ? value.filter(l => l !== key) : [...value, key]
    );
  };
  return (
    <div className="flex flex-wrap gap-[6px]">
      {ALL_LABEL_KEYS.map(key => {
        const def = LABELS[key];
        const isSelected = value.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggle(key)}
            className={`cursor-pointer rounded-full transition-opacity duration-150 ${
              isSelected
                ? 'opacity-100 ring-2 ring-slate ring-offset-[2px]'
                : 'opacity-40 hover:opacity-70'
            }`}
          >
            <Badge tone={def.tone} size="sm">{def.name}</Badge>
          </button>
        );
      })}
    </div>
  );
}

export function TaskModal({
  task,
  mode = 'view',
  columnId,
  columnOptions = [],
  onClose,
  onSave,
  onCreate,
  onToggleSubtask,
}: TaskModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');
  const [internalMode, setInternalMode] = useState<ModalMode>(mode);
  const [draft, setDraft] = useState<Task | null>(() =>
    mode === 'create'
      ? { id: '', title: '', status: 'todo', priority: 'med' }
      : null
  );
  const [targetColumnId, setTargetColumnId] = useState(
    columnId ?? columnOptions[0]?.id ?? ''
  );
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const isEditing  = internalMode === 'edit';
  const isCreating = internalMode === 'create';

  // Focus management + scroll lock
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

  // Focus trap + Escape
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (isEditing) { handleCancelEdit(); return; }
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const handleStartEdit = () => {
    if (task) setDraft({ ...task });
    setInternalMode('edit');
  };

  const handleSave = () => {
    if (draft && task) {
      onSave?.({
        ...task,
        title:       draft.title,
        description: draft.description,
        priority:    draft.priority,
        due:         draft.due,
        sprint:      draft.sprint,
        labels:      draft.labels,
        subtasks:    draft.subtasks,
      });
    }
    setDraft(null);
    setInternalMode('view');
  };

  const handleCancelEdit = () => {
    setDraft(null);
    setInternalMode('view');
  };

  const handleCreateTask = () => {
    if (!draft?.title.trim() || !targetColumnId) return;
    onCreate?.(
      {
        title:       draft.title.trim(),
        description: draft.description || undefined,
        priority:    draft.priority,
        labels:      (draft.labels ?? []).length > 0 ? draft.labels : undefined,
        due:         draft.due     || undefined,
        sprint:      draft.sprint  || undefined,
        subtasks:    (draft.subtasks ?? []).length > 0 ? draft.subtasks : undefined,
      },
      targetColumnId
    );
    onClose();
  };

  const handleCommentSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // TODO: persist comment to backend
    setCommentText('');
  };

  const addSubtaskToDraft = () => {
    const text = newSubtaskText.trim();
    if (!text) return;
    setDraft(d => d ? {
      ...d,
      subtasks: [...(d.subtasks ?? []), { id: `s${Date.now()}`, text, done: false }],
    } : d);
    setNewSubtaskText('');
  };

  if (!task && !isCreating) return null;

  const statusCfg   = task ? STATUS_CONFIG[task.status] : null;
  const priorityCfg = task ? PRIORITY_CONFIG[task.priority] : null;
  const subtasksForDisplay = (isEditing || isCreating) ? (draft?.subtasks ?? []) : (task?.subtasks ?? []);
  const doneSubs = subtasksForDisplay.filter(s => s.done).length;
  const totalSubs = subtasksForDisplay.length;
  // Show column picker when creating from the header (no pre-set column)
  const showColumnPicker = isCreating && columnOptions.length > 0 && !columnId;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(31, 26, 21, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog positioner — owns the close-on-backdrop-click */}
      <div
        onClick={isEditing ? undefined : onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        {/* Dialog stops clicks from reaching the positioner */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          ref={dialogRef}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
          className="bg-paper rounded-[16px] shadow-[var(--shadow-3)] flex w-full max-w-[920px] max-h-[90vh] overflow-hidden outline-none"
        >

          {/* ── Left panel ──────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-[36px] min-w-0">

            {/* Breadcrumb — view/edit only */}
            {!isCreating && task && statusCfg && (
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

            {/* Create mode label */}
            {isCreating && (
              <p className="font-mono text-[11px] text-ash mb-[16px] uppercase tracking-[0.08em]">
                New task
              </p>
            )}

            {/* Title */}
            {isEditing || isCreating ? (
              <input
                id="modal-title"
                type="text"
                value={draft?.title ?? ''}
                onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                placeholder="Task title…"
                aria-label="Task title"
                autoFocus={isCreating}
                className="font-display text-[34px] font-normal leading-[1.15] text-ink bg-transparent w-full mb-[12px] outline-none border-0 border-b border-chalk focus:border-slate transition-colors duration-150"
              />
            ) : (
              <h1 id="modal-title" className="font-display text-[34px] font-normal leading-[1.15] text-ink mb-[12px]">
                {task?.title ?? ''}
              </h1>
            )}

            {/* Description */}
            {isEditing || isCreating ? (
              <textarea
                value={draft?.description ?? ''}
                onChange={e => setDraft(d => d ? { ...d, description: e.target.value } : d)}
                rows={isCreating ? 4 : 3}
                placeholder="Add a description…"
                aria-label="Task description"
                className="text-[14px] text-soot leading-[1.6] mb-[24px] bg-transparent border border-chalk rounded-[8px] w-full p-[10px] outline-none resize-none focus:border-slate transition-colors duration-150 font-ui"
              />
            ) : (
              task?.description && (
                <p className="text-[14px] text-soot leading-[1.6] mb-[32px]">
                  {task.description}
                </p>
              )
            )}

            {/* ── Subtasks ── */}
            <section aria-labelledby="subtasks-heading" className="mb-[32px]">
              <div className="flex items-center justify-between mb-[12px]">
                <h2 id="subtasks-heading" className={SECTION_LABEL_CLS}>
                  Subtasks{totalSubs > 0 ? ` ${doneSubs}/${totalSubs}` : ''}
                </h2>
                {!isEditing && !isCreating && (
                  <Button variant="outline" tone="ember" size="sm">
                    <Spark size={10} color="var(--ember)" />
                    Break down with Clarity
                  </Button>
                )}
              </div>

              {totalSubs > 0 && (
                <ul className="list-none m-0 p-0 flex flex-col gap-[10px] mb-[10px]">
                  {subtasksForDisplay.map(s => (
                    <li key={s.id} className="flex items-center gap-[10px]">
                      <Checkbox
                        checked={s.done}
                        size={16}
                        onChange={() => {
                          if (isEditing || isCreating) {
                            setDraft(d => d ? {
                              ...d,
                              subtasks: (d.subtasks ?? []).map(sub =>
                                sub.id === s.id ? { ...sub, done: !sub.done } : sub
                              ),
                            } : d);
                          } else {
                            onToggleSubtask?.(s.id);
                          }
                        }}
                      />
                      <span className={`text-[14px] font-ui flex-1 ${s.done ? 'text-smoke line-through' : 'text-soot'}`}>
                        {s.text}
                      </span>
                      {(isEditing || isCreating) && (
                        <button
                          type="button"
                          aria-label={`Remove subtask: ${s.text}`}
                          onClick={() => setDraft(d => d ? {
                            ...d,
                            subtasks: (d.subtasks ?? []).filter(sub => sub.id !== s.id),
                          } : d)}
                          className="text-ash hover:text-ink transition-colors duration-150 shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {addingSubtask ? (
                <div className="flex items-center gap-[8px]">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addSubtaskToDraft(); }
                      if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtaskText(''); }
                    }}
                    placeholder="Subtask title…"
                    className={FIELD_CLS}
                  />
                  <Button type="button" variant="solid" size="sm" onClick={addSubtaskToDraft} disabled={!newSubtaskText.trim()}>
                    Add
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingSubtask(false); setNewSubtaskText(''); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-[4px]"
                  onClick={() => {
                    if (!isEditing && !isCreating) handleStartEdit();
                    setAddingSubtask(true);
                  }}
                >
                  <Icon name="plus" size={13} color="var(--ash)" />
                  Add subtask
                </Button>
              )}
            </section>

            {/* ── Attachments — view/edit only ── */}
            {!isCreating && task?.attachments && task.attachments.length > 0 && (
              <section aria-labelledby="attachments-heading" className="mb-[32px]">
                <h2 id="attachments-heading" className={`${SECTION_LABEL_CLS} mb-[10px]`}>
                  Attachments
                </h2>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-[8px]">
                  {task.attachments.map((a, i) => (
                    <li key={`${a.label}-${i}`}>
                      {a.href ? (
                        <a href={a.href} target="_blank" rel="noopener noreferrer" className={`${CHIP_CLS} no-underline`}>
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

            {/* ── Conversation — view/edit only ── */}
            {!isCreating && (
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
                              <strong className="text-[13px] text-ink font-ui font-semibold">{name}</strong>
                              {isClarity && <Badge tone="ai" size="sm">AI</Badge>}
                              <time className="text-[11px] text-ash font-mono">{comment.timestamp}</time>
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
                <form onSubmit={handleCommentSubmit} className="border border-chalk rounded-[10px] bg-bone overflow-hidden">
                  <div className="flex items-start gap-[10px] px-[14px] py-[12px]">
                    <Avatar name="Mira Cho" size={28} />
                    <textarea
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
            )}
          </div>

          {/* ── Right panel ─────────────────────────────── */}
          <aside
            aria-label="Task details"
            className="w-[260px] shrink-0 border-l border-chalk py-[16px] px-[22px] overflow-y-auto"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-[24px]">
              {isCreating ? (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="solid"
                    size="sm"
                    onClick={handleCreateTask}
                    disabled={!draft?.title.trim() || !targetColumnId}
                  >
                    Create task
                  </Button>
                </>
              ) : isEditing ? (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="button" variant="solid" size="sm" onClick={handleSave}>
                    Save changes
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-[4px]">
                    <Button type="button" variant="ghost" size="sm" onClick={handleStartEdit}>
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" size="sm" aria-label="More options" aria-haspopup="menu">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ash)" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                      More
                    </Button>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close task">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </Button>
                </>
              )}
            </div>

            <dl className="m-0 p-0">

              {/* Column picker — only in create mode from the header */}
              {showColumnPicker && (
                <>
                  <MetaTerm>Column</MetaTerm>
                  <MetaDetail>
                    <div className="flex flex-col gap-[6px]">
                      {columnOptions.map(col => (
                        <button
                          key={col.id}
                          type="button"
                          aria-pressed={targetColumnId === col.id}
                          onClick={() => setTargetColumnId(col.id)}
                          className={`text-left text-[13px] font-ui px-[10px] py-[6px] rounded-[6px] border cursor-pointer transition-colors duration-150 ${
                            targetColumnId === col.id
                              ? 'border-slate bg-slate-soft text-slate-ink font-medium'
                              : 'border-chalk bg-transparent text-ash hover:border-slate'
                          }`}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </MetaDetail>
                </>
              )}

              {/* Assignees — read-only in view/edit; hidden in create */}
              {!isCreating && (
                <>
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
                    {isEditing && (
                      <Button variant="ghost" size="sm" className="mt-[8px]">
                        <Icon name="plus" size={12} color="var(--ash)" /> Add
                      </Button>
                    )}
                  </MetaDetail>
                </>
              )}

              {/* Priority */}
              <MetaTerm>Priority</MetaTerm>
              <MetaDetail>
                {isEditing || isCreating ? (
                  <PriorityPicker
                    value={draft?.priority ?? 'med'}
                    onChange={p => setDraft(d => d ? { ...d, priority: p } : d)}
                  />
                ) : (
                  priorityCfg && (
                    <span className="inline-flex items-center gap-[7px]">
                      <span aria-hidden="true" className="w-[8px] h-[8px] rounded-full inline-block shrink-0" style={{ background: priorityCfg.dot }} />
                      <span className="text-[13px] text-soot font-ui">{priorityCfg.label}</span>
                    </span>
                  )
                )}
              </MetaDetail>

              {/* Due */}
              {(isEditing || isCreating || task?.due) && (
                <>
                  <MetaTerm>Due</MetaTerm>
                  <MetaDetail>
                    {isEditing || isCreating ? (
                      <input
                        type="text"
                        value={draft?.due ?? ''}
                        onChange={e => setDraft(d => d ? { ...d, due: e.target.value } : d)}
                        placeholder="e.g. May 10"
                        className={FIELD_CLS}
                      />
                    ) : (
                      <time className="text-[13px] text-soot font-ui">{task?.due}</time>
                    )}
                  </MetaDetail>
                </>
              )}

              {/* Labels */}
              {(isEditing || isCreating || (task?.labels && task.labels.length > 0)) && (
                <>
                  <MetaTerm>Labels</MetaTerm>
                  <MetaDetail>
                    {isEditing || isCreating ? (
                      <LabelPicker
                        value={draft?.labels ?? []}
                        onChange={labels => setDraft(d => d ? { ...d, labels } : d)}
                      />
                    ) : (
                      <ul className="list-none m-0 p-0 flex flex-wrap gap-[6px]">
                        {task?.labels?.map(key => {
                          const def = LABELS[key];
                          return def ? (
                            <li key={key}><Badge tone={def.tone} size="sm">{def.name}</Badge></li>
                          ) : null;
                        })}
                      </ul>
                    )}
                  </MetaDetail>
                </>
              )}

              {/* Sprint */}
              {(isEditing || isCreating || task?.sprint) && (
                <>
                  <MetaTerm>Sprint</MetaTerm>
                  <MetaDetail>
                    {isEditing || isCreating ? (
                      <input
                        type="text"
                        value={draft?.sprint ?? ''}
                        onChange={e => setDraft(d => d ? { ...d, sprint: e.target.value } : d)}
                        placeholder="e.g. Sprint 14"
                        className={FIELD_CLS}
                      />
                    ) : (
                      <span className="text-[13px] text-soot font-ui">{task?.sprint}</span>
                    )}
                  </MetaDetail>
                </>
              )}

              {/* Created — read-only, view mode only */}
              {!isCreating && task?.createdAt && (
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

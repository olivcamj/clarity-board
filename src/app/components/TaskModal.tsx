'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Task, Priority, Status, LabelKey } from '@/types/task';
import { LABELS, personName } from '@/data/labels';
import { formatDate } from '@/lib/utils';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';

export type ModalMode = 'view' | 'edit' | 'create';
export type ColumnOption = { id: string; name: string; status?: Status };

export interface TeamMemberOption {
  id: string;
  name: string;
}

export interface TaskModalProps {
  task?: Task;
  mode?: ModalMode;
  columnId?: string;
  columnOptions?: ColumnOption[];
  teamMembers?: TeamMemberOption[];
  onClose: () => void;
  onSave?: (task: Task) => void;
  onCreate?: (
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'labels' | 'due' | 'sprint' | 'subtasks' | 'assignees'>,
    columnId: string
  ) => void;
  onDelete?: () => void | Promise<void>;
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

function resolveMember(id: string, members: TeamMemberOption[]): string {
  return members.find(member => member.id === id)?.name ?? personName(id);
}

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
  onChange: (priority: Priority) => void;
}) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {PRIORITY_ORDER.map(priority => {
        const config = PRIORITY_CONFIG[priority];
        const isSelected = value === priority;
        return (
          <button
            key={priority}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(priority)}
            className={`inline-flex items-center gap-[6px] text-[12px] font-ui py-[3px] px-[10px] rounded-full border cursor-pointer transition-colors duration-150 ${
              isSelected
                ? 'border-slate bg-slate-soft text-slate-ink font-medium'
                : 'border-chalk bg-transparent text-ash hover:border-slate'
            }`}
          >
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: config.dot }} />
            {config.label}
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
      value.includes(key) ? value.filter(label => label !== key) : [...value, key]
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
  teamMembers = [],
  onClose,
  onSave,
  onCreate,
  onDelete,
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

  // useEffect(() => {
  //   if (mode === 'create') {
  //     setTargetColumnId(columnId ?? columnOptions[0]?.id ?? '');
  //   }
  // }, [columnId, columnOptions, mode]);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setTargetColumnId(columnId ?? columnOptions[0]?.id ?? '');
    setInternalMode('edit');
  };

  const handleSave = () => {
    if (draft && task) {
      const targetStatus = columnOptions.find(column => column.id === targetColumnId)?.status;
      onSave?.({
        ...task,
        title:       draft.title,
        description: draft.description,
        priority:    draft.priority,
        due:         draft.due,
        sprint:      draft.sprint,
        labels:      draft.labels,
        subtasks:    draft.subtasks,
        status:      targetStatus ?? task.status,
      });
    }
    setDraft(null);
    setInternalMode('view');
  };

  const handleCancelEdit = () => {
    setDraft(null);
    setTargetColumnId(columnId ?? columnOptions[0]?.id ?? '');
    setInternalMode('view');
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    await onDelete?.();
    setDeleteLoading(false);
    setConfirmDeleteOpen(false);
    onClose();
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
        assignees:   (draft.assignees ?? []).length > 0 ? draft.assignees : undefined,
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
    setDraft(draft => draft ? {
      ...draft,
      subtasks: [...(draft.subtasks ?? []), { id: `s${Date.now()}`, text, done: false }],
    } : draft);
    setNewSubtaskText('');
  };

  if (!task && !isCreating) return null;

  const statusConfig   = task ? STATUS_CONFIG[task.status] : null;
  const priorityConfig = task ? PRIORITY_CONFIG[task.priority] : null;
  const subtasksForDisplay = (isEditing || isCreating) ? (draft?.subtasks ?? []) : (task?.subtasks ?? []);
  const doneSubs = subtasksForDisplay.filter(s => s.done).length;
  const totalSubs = subtasksForDisplay.length;
  // Show the column picker when creating from the header (no pre-set column)
  // or whenever editing an existing task (lets it be moved without dragging).
  const showColumnPicker =
    (isCreating && columnOptions.length > 0 && !columnId) ||
    (isEditing && columnOptions.length > 0);

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
        className="p-[12px] md:p-[24px]"
        style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Dialog stops clicks from reaching the positioner */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          ref={dialogRef}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
          className="bg-paper rounded-[16px] shadow-[var(--shadow-3)] flex flex-col md:flex-row w-full max-w-[920px] max-h-[90vh] overflow-y-auto md:overflow-hidden outline-none"
        >

          {/* ── Left panel ──────────────────────────────── */}
          <div className="flex-1 overflow-visible md:overflow-y-auto p-[20px] md:p-[36px] min-w-0">

            {/* Breadcrumb — view/edit only */}
            {!isCreating && task && statusConfig && (
              <p
                aria-label={`Task #${task.id.slice(-5).toUpperCase()}, status: ${statusConfig.label}${task.sprint ? `, ${task.sprint}` : ''}`}
                className="flex items-center gap-[8px] mb-[14px] flex-wrap"
              >
                <span className="font-mono text-[11px] text-ash">{`#${task.id.slice(-5).toUpperCase()}`}</span>
                <span aria-hidden="true" className="text-chalk">·</span>
                <span className="inline-flex items-center gap-[5px]">
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full inline-block shrink-0"
                    style={{ background: statusConfig.dot }}
                  />
                  <span className="font-ui text-[11px] text-soot">{statusConfig.label}</span>
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
                className="font-display text-[24px] md:text-[34px] font-normal leading-[1.15] text-ink bg-transparent w-full mb-[12px] outline-none border-0 border-b border-chalk focus:border-slate transition-colors duration-150"
              />
            ) : (
              <h1 id="modal-title" className="font-display text-[24px] md:text-[34px] font-normal leading-[1.15] text-ink mb-[12px]">
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
            className="w-full md:w-[260px] shrink-0 border-t md:border-t-0 md:border-l border-chalk py-[16px] px-[16px] md:px-[22px] overflow-visible md:overflow-y-auto"
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
                    <div style={{ position: 'relative' }}>
                      {moreMenuOpen && (
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 52 }}
                          onClick={() => setMoreMenuOpen(false)}
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="More options"
                        aria-haspopup="menu"
                        aria-expanded={moreMenuOpen}
                        onClick={() => setMoreMenuOpen(isOpen => !isOpen)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ash)" aria-hidden="true">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                        More
                      </Button>
                      {moreMenuOpen && (
                        <div
                          role="menu"
                          style={{ position: 'absolute', top: '100%', left: 0, zIndex: 53, minWidth: 148 }}
                          className="bg-paper border border-chalk rounded-[8px] shadow-[var(--shadow-3)] py-[4px] mt-[4px]"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setConfirmDeleteOpen(true);
                            }}
                            className="w-full text-left px-[12px] py-[8px] text-[13px] font-ui transition-colors duration-150 hover:bg-bone"
                            style={{ color: 'var(--rose)' }}
                          >
                            Delete task
                          </button>
                        </div>
                      )}
                    </div>
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

              {/* Column picker — create-from-header, or editing (to move the task) */}
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

              {/* Assignees */}
              {(isEditing || isCreating || (task?.assignees ?? []).length > 0) && (
                <>
                  <MetaTerm>Assignees</MetaTerm>
                  <MetaDetail>
                    {isEditing || isCreating ? (
                      teamMembers.length > 1 ? (
                        <ul className="list-none m-0 p-0 flex flex-col gap-[4px]">
                          {teamMembers.map(member => {
                            const isAssigned = (draft?.assignees ?? []).includes(member.id);
                            return (
                              <li key={member.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraft(draft => draft ? {
                                      ...draft,
                                      assignees: isAssigned
                                        ? (draft.assignees ?? []).filter(id => id !== member.id)
                                        : [...(draft.assignees ?? []), member.id],
                                    } : draft)
                                  }
                                  className={`w-full flex items-center gap-[9px] px-[8px] py-[5px] rounded-[6px] text-left transition-colors duration-150 ${
                                    isAssigned ? 'bg-slate-soft' : 'hover:bg-bone'
                                  }`}
                                >
                                  <Avatar name={member.name} size={22} />
                                  <span className="text-[13px] text-soot font-ui flex-1 truncate">{member.name}</span>
                                  {isAssigned && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                      <polyline points="5 12 10 17 19 7" />
                                    </svg>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-[12px] text-ash font-ui m-0">
                          {teamMembers.length === 1 ? 'You\'re the only member on this team.' : 'No team members found.'}
                        </p>
                      )
                    ) : (
                      <ul className="list-none m-0 p-0 flex flex-col gap-[8px]">
                        {(task?.assignees ?? []).map(id => {
                          const member = teamMembers.find(member => member.id === id);
                          const name = member?.name ?? personName(id);
                          return (
                            <li key={id} className="flex items-center gap-[9px]">
                              <Avatar name={name} size={24} />
                              <span className="text-[13px] text-soot font-ui">{name}</span>
                            </li>
                          );
                        })}
                      </ul>
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
                    onChange={priority => setDraft(draft => draft ? { ...draft, priority: priority } : draft)}
                  />
                ) : (
                  priorityConfig && (
                    <span className="inline-flex items-center gap-[7px]">
                      <span aria-hidden="true" className="w-[8px] h-[8px] rounded-full inline-block shrink-0" style={{ background: priorityConfig.dot }} />
                      <span className="text-[13px] text-soot font-ui">{priorityConfig.label}</span>
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
                        type="date"
                        value={draft?.due ?? ''}
                        onChange={e => setDraft(draft => draft ? { ...draft, due: e.target.value } : draft)}
                        className={FIELD_CLS}
                      />
                    ) : (
                      <time className="text-[13px] text-soot font-ui">{task?.due ? formatDate(task.due) : ''}</time>
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
                      {formatDate(task.createdAt)}{task.createdBy ? ` by ${resolveMember(task.createdBy, teamMembers)}` : ''}
                    </span>
                  </MetaDetail>
                </>
              )}

            </dl>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete task"
        message="This will permanently delete this task and all its subtasks. This cannot be undone."
        confirmLabel="Delete task"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}

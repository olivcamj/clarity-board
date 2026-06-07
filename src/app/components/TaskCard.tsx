"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";

import type { Priority, Task } from "@/types/task";
import { LABELS, personName } from "@/data/labels";

import { AvatarStack } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Checkbox } from "../ui/Checkbox";
import { Icon } from "../ui/Icon";
import { Spark } from "../ui/Spark";
import { useDragListeners } from "./Draggable";

export type Density = "compact" | "comfortable";

export interface TaskCardProps {
  task: Task;
  density?: Density;
  dragging?: boolean;
  onClick?: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
}

export function TaskCard({
  task,
  density = "comfortable",
  dragging = false,
  onClick,
  onToggleSubtask,
}: TaskCardProps) {
  const compact = density === "compact";
  const subs = task.subtasks ?? [];
  const subsTotal = subs.length;
  const subsDone = subs.filter((s) => s.done).length;
  const progressPct = subsTotal === 0 ? 0 : (subsDone / subsTotal) * 100;

  const [hovered, setHovered] = useState(false);
  const elevated = (hovered && !dragging) || dragging;
  const dragListeners = useDragListeners();

  const cardStyle: CSSProperties = {
    border: `1px solid ${task.ai ? "var(--ember)" : "var(--border)"}`,
    borderRadius: 8,
    background: "var(--paper)",
    padding: compact ? "8px 10px" : "11px 13px",
    boxShadow: dragging
      ? "var(--shadow-3)"
      : elevated
      ? "var(--shadow-2)"
      : "var(--shadow-1)",
    opacity: dragging ? 0.5 : 1,
    transform: dragging ? "rotate(-1deg)" : "none",
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleSubtaskClick = (subId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    onToggleSubtask?.(subId);
  };


  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={task.title}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-paper rounded-lg cursor-grab relative transition-[box-shadow,border-color,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] active:cursor-grabbing"
      style={cardStyle}
      data-task-id={task.id}
      {...(dragListeners as object)}
    >
      {task.ai && (
        <span
          aria-label="Clarity AI suggested"
          className="absolute -top-[9px] left-[10px] inline-flex items-center gap-1 rounded-full bg-ember-soft text-ember-hot border border-ember font-ui font-medium"
          style={{ fontSize: 10, padding: '2px 7px' }}
        >
          <Spark size={9} color="var(--ember)" /> Clarity suggested
        </span>
      )}

      {/* Header: id · priority · due */}
      <div className="flex items-center" style={{ marginBottom: 4 }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span className="font-mono text-ash" style={{ fontSize: 10 }} aria-label={`Task #${task.id.slice(-5).toUpperCase()}`}>{`#${task.id.slice(-5).toUpperCase()}`}</span>
          {task.priority === "high" && (
            <span
              className="font-mono text-rose inline-flex items-center"
              style={{ fontSize: 10, gap: 3 }}
              aria-label="High priority"
            >
              <Icon name="flag" size={9} color="var(--rose)" />
              high
            </span>
          )}
        </div>
        {task.due && (
          <span className="ml-auto font-mono text-ash" style={{ fontSize: 10 }} aria-label={`Due ${task.due}`}>
            {task.due}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-ui font-semibold text-ink"
        style={{ fontSize: compact ? 13 : 14, lineHeight: 1.3, marginBottom: compact ? 0 : 6 }}
      >
        {task.title}
      </h3>

      {/* Description */}
      {!compact && task.description && (
        <p className="text-ash line-clamp-2" style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 10 }}>
          {task.description}
        </p>
      )}

      {/* Subtasks */}
      {!compact && subsTotal > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
            <Icon name="check" size={12} color="var(--ash)" />
            <span className="font-mono text-ash" style={{ fontSize: 10.5 }} aria-hidden="true">
              {subsDone}/{subsTotal} subtasks
            </span>
            <div
              role="progressbar"
              aria-label={`${subsDone} of ${subsTotal} subtasks complete`}
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="flex-1 h-[3px] rounded-full bg-bone relative overflow-hidden ml-1.5"
            >
              <div
                className="absolute inset-0 bg-slate transition-[width] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] data-[status=done]:bg-sage"
                data-status={task.status}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {subs.slice(0, 2).map((s) => (
              <li
                key={s.id}
                className="flex items-center cursor-pointer text-soot data-[done=true]:text-smoke data-[done=true]:line-through"
                style={{ gap: 7, fontSize: 12 }}
                data-done={s.done}
                onClick={handleSubtaskClick(s.id)}
              >
                <Checkbox
                  checked={s.done}
                  size={13}
                  onChange={() => onToggleSubtask?.(s.id)}
                />
                <span className="flex-1">{s.text}</span>
              </li>
            ))}
            {subsTotal > 2 && (
              <li aria-hidden="true" className="text-ash" style={{ fontSize: 11, paddingLeft: 20 }}>
                +{subsTotal - 2} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Attachments */}
      {!compact && task.attachments && task.attachments.length > 0 && (
        <ul
          className="flex text-slate font-mono"
          style={{ listStyle: "none", padding: 0, marginBottom: 8, gap: 10, fontSize: 11 }}
          aria-label="Attachments"
        >
          {task.attachments.map((a, i) => (
            <li key={`${a.label}-${i}`} className="inline-flex items-center" style={{ gap: 4 }}>
              <Icon name={a.kind === "link" ? "link" : "attach"} size={11} />
              {a.label}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center" style={{ marginTop: compact ? 6 : 4 }}>
        <div className="flex flex-wrap" style={{ gap: 4 }} aria-label="Labels">
          {task.labels?.map((key) => {
            const def = LABELS[key];
            return def ? (
              <Badge key={key} tone={def.tone} size="sm">
                {def.name}
              </Badge>
            ) : null;
          })}
        </div>

        <div className="ml-auto flex items-center" style={{ gap: 10 }}>
          {(task.comments ?? 0) > 0 && (
            <span
              className="inline-flex items-center font-mono text-ash"
              style={{ fontSize: 10, gap: 3 }}
              aria-label={`${task.comments} comment${task.comments === 1 ? "" : "s"}`}
            >
              <Icon name="comment" size={11} color="var(--ash)" />
              <span aria-hidden="true">{task.comments}</span>
            </span>
          )}

          {task.assignees && task.assignees.length > 0 && (
            <AvatarStack
              names={task.assignees.map(personName)}
              size={20}
              max={3}
            />
          )}
        </div>
      </div>
    </div>
  );
}

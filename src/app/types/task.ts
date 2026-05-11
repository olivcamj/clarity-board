export type Priority = "high" | "med" | "low";
export type Status = "todo" | "doing" | "review" | "done";

export type LabelKey =
  | "design"
  | "frontend"
  | "backend"
  | "infra"
  | "research"
  | "bug";

export type BadgeTone =
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "ai"
  | "slate"
  | "plum"
  | "ghost";

export interface LabelDef {
  name: string;
  tone: BadgeTone;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  kind: "link" | "file";
  label: string;
  href?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  labels?: LabelKey[];
  assignees?: string[];           // person IDs
  subtasks?: Subtask[];
  attachments?: Attachment[];
  priority: Priority;
  due?: string;                   // human-readable ("Apr 29")
  sprint?: string;
  comments?: number;
  activity?: number;
  /** Whether this task was suggested by the Clarity AI layer. */
  ai?: boolean;
  source?: string;
}

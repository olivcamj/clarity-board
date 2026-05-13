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

export interface TaskComment {
  id: string;
  authorId: string;   // person ID from PEOPLE_BY_ID, or "clarity" for AI
  text: string;
  timestamp: string;
  isAI?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  labels?: LabelKey[];
  assignees?: string[];
  subtasks?: Subtask[];
  attachments?: Attachment[];
  priority: Priority;
  due?: string;
  sprint?: string;
  createdAt?: string;
  createdBy?: string;
  comments?: number;
  conversation?: TaskComment[];
  activity?: number;
  ai?: boolean;
  source?: string;
}

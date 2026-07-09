import {
  TaskStatus,
  Priority,
  AttachmentKind,
  Prisma,
} from '../../../generated/client';

// Prisma query shape this DTO expects
export const taskIncludes = {
  assignees: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  subtasks: { orderBy: { position: 'asc' as const } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: { id: true, name: true } } },
  },
  attachments: true,
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskIncludes }>;

interface SubtaskDto {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

interface CommentDto {
  id: string;
  text: string;
  isAI: boolean;
  createdAt: string;
  author?: { id: string; name: string };
}

interface AttachmentDto {
  id: string;
  kind: 'link' | 'file';
  label: string;
  href?: string;
}

export class TaskResponseDto {
  id!: string;
  boardId!: string;
  title!: string;
  description?: string;
  status!: string;
  priority!: string;
  labels!: string[];
  due?: string;
  sprint?: string;
  position!: number;
  aiGenerated!: boolean;
  source?: string;
  createdAt!: string;
  updatedAt!: string;
  createdBy!: { id: string; name: string };
  assignees!: Array<{ id: string; name: string }>;
  subtasks!: SubtaskDto[];
  comments!: CommentDto[];
  attachments!: AttachmentDto[];

  static fromPrisma(task: TaskWithRelations): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.boardId = task.boardId;
    dto.title = task.title;
    dto.description = task.description ?? undefined;
    dto.status = TaskResponseDto.mapStatus(task.status);
    dto.priority = TaskResponseDto.mapPriority(task.priority);
    dto.labels = task.labels;
    dto.due = task.due ?? undefined;
    dto.sprint = task.sprint ?? undefined;
    dto.position = task.position;
    dto.aiGenerated = task.aiGenerated;
    dto.source = task.source ?? undefined;
    dto.createdAt = task.createdAt.toISOString();
    dto.updatedAt = task.updatedAt.toISOString();
    dto.createdBy = task.createdBy;
    dto.assignees = task.assignees;
    dto.subtasks = task.subtasks.map((subtask) => ({
      id: subtask.id,
      text: subtask.text,
      done: subtask.done,
      position: subtask.position,
    }));
    dto.comments = task.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      isAI: comment.isAI,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author ?? undefined,
    }));
    dto.attachments = task.attachments.map((attachment) => ({
      id: attachment.id,
      kind: attachment.kind === AttachmentKind.LINK ? 'link' : 'file',
      label: attachment.label,
      href: attachment.href ?? undefined,
    }));
    return dto;
  }

  private static mapStatus(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'todo',
      [TaskStatus.DOING]: 'doing',
      [TaskStatus.REVIEW]: 'review',
      [TaskStatus.DONE]: 'done',
    };
    return map[status];
  }

  private static mapPriority(priority: Priority): string {
    const map: Record<Priority, string> = {
      [Priority.HIGH]: 'high',
      [Priority.MED]: 'med',
      [Priority.LOW]: 'low',
    };
    return map[priority];
  }
}

interface AssigneeInput {
  id: string;
  name: string;
}

interface TaskInput {
  id: string;
  title: string;
  status: string;
  assignees?: AssigneeInput[];
}

interface BoardInput {
  id: string;
  name: string;
  teamId: string;
  team?: { name: string } | null;
  tasks?: TaskInput[];
  _count?: { tasks: number };
}

export class BoardResponseDto {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  taskCount?: number;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    assignees: Array<{ id: string; name: string }>;
  }>;

  constructor(board: BoardInput, includeRelations = false) {
    this.id = board.id;
    this.name = board.name;
    this.teamId = board.teamId;
    this.teamName = board.team?.name;

    if (includeRelations) {
      this.tasks = board.tasks?.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignees: task.assignees ?? [],
      }));
    } else {
      this.taskCount = board._count?.tasks ?? board.tasks?.length ?? 0;
    }
  }
}

import demoData from '../../lib/demo/demo-data.json';
import type { Task, Status, Priority, LabelKey } from '../../types/task';
import type { TeamMemberOption } from '../../components/TaskModal';
import { DemoTaskboardClient } from './DemoTaskboardClient';

export default async function DemoTaskboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { boardId = 'launch' } = await searchParams;
  const resolvedBoardId = Array.isArray(boardId) ? boardId[0] : boardId;

  const board = demoData.boards.find(b => b.id === resolvedBoardId) ?? demoData.boards[0];

  const tasks: Task[] = demoData.tasks
    .filter(task => task.board === board.id)
    .map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status as Status,
      priority: task.priority as Priority,
      labels: (task.labels ?? []) as LabelKey[],
      assignees: task.assignees ?? [],
      subtasks: task.subtasks ?? [],
      attachments: (task.attachments ?? []) as Task['attachments'],
      due: task.due ?? undefined,
      sprint: task.sprint ?? undefined,
      comments: task.comments ?? 0,
      activity: task.activity ?? 0,
    }));

  const teamMembers: TeamMemberOption[] = board.memberIds
    .map(id => {
      const member = demoData.members.find(member => member.id === id);
      return member ? { id: member.id, name: member.name } : null;
    })
    .filter((member): member is TeamMemberOption => member !== null);

  const teamNames = teamMembers.map(m => m.name);

  return (
    <DemoTaskboardClient
      boardId={board.id}
      boardName={board.name}
      sprint={board.sprint}
      initialTasks={tasks}
      teamMembers={teamMembers}
      teamNames={teamNames}
    />
  );
}

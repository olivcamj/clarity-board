import demoData from '../../lib/demo/demo-data.json';
import type { MyTask } from '../../components/dashboard/MyTasksList';
import type { Status, Priority, LabelKey } from '../../types/task';
import { DemoDashboardClient } from './DemoDashboardClient';

export const dynamic = 'force-static';

export default function DemoDashboardPage() {
  const { currentUser, boards, tasks, dashboardStats } = demoData;

  const myTasks: MyTask[] = tasks
    .filter(task => task.assignees.includes('u1') && task.status !== 'done')
    .map(task => {
      const board = boards.find(board => board.id === task.board);
      return {
        id: task.id,
        title: task.title,
        status: task.status as Status,
        due: task.due ?? null,
        board: { id: task.board, name: board?.name ?? task.board },
      };
    })
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    })
    .slice(0, 6);

  const demoBoards = boards.map(board => {
    const taskCount = tasks.filter(task => task.board === board.id).length;
    return { id: board.id, name: board.name, taskCount };
  });

  return (
    <DemoDashboardClient
      userName={currentUser.name}
      stats={dashboardStats}
      myTasks={myTasks}
      boards={demoBoards}
    />
  );
}

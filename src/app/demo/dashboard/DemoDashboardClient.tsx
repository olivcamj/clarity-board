'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TopBar } from '../../components/TopBar';
import { StatCards } from '../../components/dashboard/StatCards';
import { MyTasksList, type MyTask } from '../../components/dashboard/MyTasksList';
import { ClaritySuggestions } from '../../components/dashboard/ClaritySuggestions';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
}

function dateLine() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

interface DemoBoard {
  id: string;
  name: string;
  taskCount: number;
}

interface DemoDashboardClientProps {
  userName: string;
  stats: { dueToday: number; overdue: number; inFlight: number };
  myTasks: MyTask[];
  boards: DemoBoard[];
}

function BoardCard({ board }: { board: DemoBoard }) {
  return (
    <Link
      href={`/demo/taskboard?boardId=${board.id}`}
      className="flex flex-col gap-[6px] p-[16px] rounded-[10px] border border-chalk bg-paper transition-colors duration-150 hover:border-slate no-underline group"
    >
      <span className="font-ui font-medium text-[13px] text-ink group-hover:text-slate transition-colors duration-150 leading-snug">
        {board.name}
      </span>
      <span className="font-mono text-[10px] text-ash">Kiln Studio</span>
      <span className="font-mono text-[10px] text-ash">
        {board.taskCount} task{board.taskCount !== 1 ? 's' : ''}
      </span>
    </Link>
  );
}

export function DemoDashboardClient({ userName, stats, myTasks: initialTasks, boards }: DemoDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [myTasks, setMyTasks] = useState<MyTask[]>(initialTasks);

  function handleComplete(taskId: string) {
    setMyTasks(prev => prev.filter(task => task.id !== taskId));
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <TopBar title="Home" showHomeIcon searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="px-[40px] py-[40px]">
        <div className="flex items-start justify-between mb-[24px]">
          <div>
            <p className="font-mono text-[10px] text-ash tracking-[0.1em] uppercase mb-[6px]">
              {dateLine()}
            </p>
            <h1 className="font-display text-[38px] font-normal text-ink leading-[1.1] m-0">
              {greeting(userName)}
            </h1>
          </div>
        </div>

        <StatCards dueToday={stats.dueToday} overdue={stats.overdue} inFlight={stats.inFlight} />

        <div className="grid gap-[32px]" style={{ gridTemplateColumns: '1fr 360px' }}>
          <MyTasksList
            tasks={myTasks}
            onComplete={handleComplete}
            getBoardHref={(boardId) => `/demo/taskboard?boardId=${boardId}`}
          />
          <div>
            <ClaritySuggestions />
            <ActivityFeed />
          </div>
        </div>

        {boards.length > 0 && (
          <section className="mt-[48px]">
            <div className="mb-[14px]">
              <p className="font-mono text-[10px] text-ember tracking-[0.1em] uppercase mb-[4px]">No. II</p>
              <h2 className="font-display text-[28px] font-normal text-ink m-0">
                Your <em>boards.</em>
              </h2>
            </div>
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {boards.map(board => (
                <BoardCard key={board.id} board={board} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import { Avatar } from '../../ui/Avatar';

// Placeholder content — there's no activity-log backend yet. Once one
// exists, swap this static array for a real fetch.
const ACTIVITY = [
  { id: 'a1', name: 'Jules Park', action: 'moved CB-129 to Doing', board: 'Launch v2.0', time: '2m' },
  { id: 'a2', name: 'Theo Adeyemi', action: 'commented on CB-088', board: 'Brand & Marketing', time: '24m' },
  { id: 'a3', name: 'Mira Cho', action: 'created CB-201', board: 'Design System', time: '1h' },
];

export function ActivityFeed() {
  return (
    <section className="mt-[24px]">
      <h2 className="font-mono text-[11px] text-ash uppercase tracking-[0.08em] mb-[12px]">
        Activity &middot; last 24 hours
      </h2>
      <ul className="list-none m-0 p-0 flex flex-col gap-[12px]">
        {ACTIVITY.map(entry => (
          <li key={entry.id} className="flex items-start gap-[10px]">
            <Avatar name={entry.name} size={24} />
            <div className="flex-1 min-w-0">
              <p className="font-ui text-[12px] text-ink m-0">
                <span className="font-medium">{entry.name}</span> {entry.action}
              </p>
              <p className="font-mono text-[10px] text-ash m-0">{entry.board}</p>
            </div>
            <span className="font-mono text-[10px] text-ash shrink-0">{entry.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

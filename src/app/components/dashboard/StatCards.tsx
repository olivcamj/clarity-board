import { Icon } from '../../ui/Icon';

interface StatCardsProps {
  dueToday: number;
  overdue: number;
  inFlight: number;
}

function StatCard({
  icon,
  count,
  label,
  bg,
  fg,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <div className="flex items-center gap-[12px] p-[14px] rounded-[10px] border border-chalk bg-paper flex-1">
      <div
        className="flex items-center justify-center rounded-[8px] shrink-0"
        style={{ width: 36, height: 36, background: bg, color: fg }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <p className="font-display text-[26px] leading-none text-ink m-0">{count}</p>
        <p className="font-ui text-[12px] text-ash m-0">{label}</p>
      </div>
    </div>
  );
}

export function StatCards({ dueToday, overdue, inFlight }: StatCardsProps) {
  return (
    <div className="flex gap-[12px] mb-[28px]">
      <StatCard
        icon={<Icon name="clock" size={16} color="var(--sky)" />}
        count={dueToday}
        label="Due today"
        bg="var(--sky-soft)"
        fg="var(--sky)"
      />
      {/* @Mentions placeholder — no notifications/mention backend exists yet */}
      <StatCard
        icon={<Icon name="comment" size={16} color="var(--ember)" />}
        count={0}
        label="@ Mentions"
        bg="var(--ember-soft)"
        fg="var(--ember)"
      />
      <StatCard
        icon={<Icon name="flag" size={16} color="var(--rose)" />}
        count={overdue}
        label="Overdue"
        bg="var(--rose-soft)"
        fg="var(--rose)"
      />
      <StatCard
        icon={<Icon name="layers" size={16} color="var(--ochre)" />}
        count={inFlight}
        label="In flight"
        bg="var(--ochre-soft)"
        fg="var(--ochre)"
      />
    </div>
  );
}

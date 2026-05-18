const COLUMNS = [
  { cards: [{ chip: true, lines: 2, footer: true }, { chip: false, lines: 1, footer: true }] },
  { cards: [{ chip: true, lines: 2, footer: true }] },
  { cards: [] },
];

function SkeletonBar({ width, height = 10, color = 'var(--sand)' }: { width: string | number; height?: number; color?: string }) {
  return (
    <div
      className="animate-pulse shrink-0"
      style={{ width, height, borderRadius: 4, background: color }}
    />
  );
}

function SkeletonHeader() {
  return (
    <header>
      {/* Nav row */}
      <div className="flex items-center border-b border-chalk px-[24px] py-[12px] bg-bone" style={{ gap: 10 }}>
        <SkeletonBar width={56} height={14} />
        <div className="flex-1 flex justify-center px-[32px]">
          <div
            className="w-full max-w-[480px] rounded-[8px] animate-pulse"
            style={{ height: 34, background: 'var(--sand)' }}
          />
        </div>
        <SkeletonBar width={90} height={28} />
      </div>

      {/* Sprint header row */}
      <div className="flex items-end justify-between px-[24px] py-[20px] border-b border-chalk bg-paper">
        <div className="flex flex-col" style={{ gap: 10 }}>
          <SkeletonBar width={160} height={8} color="var(--biscuit)" />
          <SkeletonBar width={200} height={38} />
          <SkeletonBar width={220} height={10} color="var(--biscuit)" />
        </div>
        <div className="flex items-center pb-[4px]" style={{ gap: 12 }}>
          <SkeletonBar width={180} height={6} color="var(--biscuit)" />
          <SkeletonBar width={56} height={28} color="var(--biscuit)" />
          <SkeletonBar width={60} height={28} color="var(--biscuit)" />
          <SkeletonBar width={88} height={30} />
        </div>
      </div>
    </header>
  );
}

function SkeletonCard({ chip, lines, footer }: { chip: boolean; lines: number; footer: boolean }) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '11px 13px',
        gap: 8,
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <div className="flex items-center" style={{ gap: 6 }}>
        <SkeletonBar width={36} height={8} color="var(--biscuit)" />
        {chip && <SkeletonBar width={24} height={8} color="var(--rose-soft)" />}
      </div>
      <SkeletonBar width={lines > 1 ? '80%' : '60%'} height={12} />
      {lines > 1 && (
        <div className="flex flex-col" style={{ gap: 4 }}>
          <SkeletonBar width="100%" height={9} color="var(--biscuit)" />
          <SkeletonBar width="65%"  height={9} color="var(--biscuit)" />
        </div>
      )}
      {footer && (
        <div className="flex items-center" style={{ marginTop: 2 }}>
          <div className="flex" style={{ gap: 4 }}>
            <SkeletonBar width={42} height={16} />
            <SkeletonBar width={52} height={16} />
          </div>
          <div className="flex items-center" style={{ marginLeft: 'auto', gap: 6 }}>
            <SkeletonBar width={20} height={8} color="var(--biscuit)" />
            <div
              className="animate-pulse shrink-0"
              style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--sand)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonColumn({ cards }: { cards: { chip: boolean; lines: number; footer: boolean }[] }) {
  return (
    <div
      className="w-[260px] shrink-0 flex flex-col"
      style={{ minHeight: 384, background: 'var(--bone)', borderRadius: 12, padding: 14, gap: 8 }}
    >
      {/* Column header: dot · name · count · badge */}
      <div className="flex items-center mb-[4px]" style={{ gap: 6 }}>
        <div
          className="animate-pulse shrink-0"
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sand)' }}
        />
        <SkeletonBar width={64} height={8} color="var(--chalk)" />
        <SkeletonBar width={10} height={8} color="var(--biscuit)" />
        <SkeletonBar width={52} height={16} color="var(--biscuit)" />
      </div>

      {cards.map((card, i) => (
        <SkeletonCard key={i} {...card} />
      ))}
    </div>
  );
}

export default function TaskBoardLoading() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      <SkeletonHeader />
      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-max mx-auto" style={{ gap: 20, padding: 24 }}>
          {COLUMNS.map((col, i) => (
            <SkeletonColumn key={i} cards={col.cards} />
          ))}
        </div>
      </div>
    </div>
  );
}

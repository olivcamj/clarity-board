const COLUMNS = [
  { cards: [{ chip: true, lines: 2, footer: true }, { chip: false, lines: 1, footer: true }] },
  { cards: [{ chip: true, lines: 2, footer: true }] },
  { cards: [] },
];

function SkeletonBar({ width, height = 10, color = 'var(--sand)' }: { width: string | number; height?: number; color?: string }) {
  return (
    <div
      className="animate-pulse"
      style={{ width, height, borderRadius: 4, background: color, flexShrink: 0 }}
    />
  );
}

function SkeletonCard({ chip, lines, footer }: { chip: boolean; lines: number; footer: boolean }) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '11px 13px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: 'var(--shadow-1)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <SkeletonBar width={36} height={8} color="var(--biscuit)" />
        {chip && <SkeletonBar width={24} height={8} color="var(--rose-soft)" />}
      </div>

      {/* Title */}
      <SkeletonBar width={lines > 1 ? '80%' : '60%'} height={12} color="var(--sand)" />

      {/* Description */}
      {lines > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SkeletonBar width="100%" height={9} color="var(--biscuit)" />
          <SkeletonBar width="65%" height={9} color="var(--biscuit)" />
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <SkeletonBar width={42} height={16} color="var(--sand)" />
            <SkeletonBar width={52} height={16} color="var(--sand)" />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SkeletonBar width={20} height={8} color="var(--biscuit)" />
            <div
              className="animate-pulse"
              style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--sand)', flexShrink: 0 }}
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
      style={{
        width: 260,
        minHeight: 384,
        flexShrink: 0,
        background: 'var(--bone)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Column heading */}
      <SkeletonBar width={56} height={8} color="var(--chalk)" />

      {cards.map((card, i) => (
        <SkeletonCard key={i} {...card} />
      ))}
    </div>
  );
}

export default function TaskBoardLoading() {
  return (
    <div style={{ width: '100%', overflowX: 'auto', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', gap: 20, padding: 24, minWidth: 'max-content', margin: '0 auto' }}>
        {COLUMNS.map((col, i) => (
          <SkeletonColumn key={i} cards={col.cards} />
        ))}
      </div>
    </div>
  );
}

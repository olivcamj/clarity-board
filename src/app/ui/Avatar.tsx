const PALETTE = [
  "#C98277",
  "#7A8C6E",
  "#6C8AA6",
  "#C8A04E",
  "#9273A1",
  "#3B6FB5",
];

function seededColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = 24, tone = undefined }: { name: string; size?: number; tone?: string }) {
  const bg = tone ?? seededColor(name);
  return (
    <div
      role="img"
      aria-label={name}
      title={name}
      className="rounded-full text-white inline-flex items-center justify-center font-semibold border-[1.5px] border-paper shadow-[0_0_0_1px_var(--chalk)] shrink-0 select-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}
    >
      <span aria-hidden="true">{initials(name)}</span>
    </div>
  );
}

export function AvatarStack({ names, size = 22, max = 3 }: { names: string[]; size?: number; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const label = extra > 0
    ? `Assigned to ${shown.join(", ")} and ${extra} more`
    : `Assigned to ${names.join(", ")}`;

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center"
    >
      {shown.map((n, i) => (
        <div
          key={`${n}-${i}`}
          className={`relative inline-flex items-center${i === 0 ? "" : " -ml-[6px]"}`}
          style={{ zIndex: shown.length - i }}
        >
          <Avatar name={n} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          aria-hidden="true"
          className="-ml-[6px] z-0 rounded-full bg-bone text-ash border-[1.5px] border-paper shadow-[0_0_0_1px_var(--chalk)] inline-flex items-center justify-center font-mono text-[10px] font-medium"
          style={{ width: size, height: size }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

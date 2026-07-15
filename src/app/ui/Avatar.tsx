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

export function Avatar({
  name,
  size = 24,
  tone = undefined,
  online = undefined,
}: {
  name: string;
  size?: number;
  tone?: string;
  /** When set, renders a small presence dot and appends "(online/offline)" to the accessible name. */
  online?: boolean;
}) {
  const bg = tone ?? seededColor(name);
  const label = online === undefined ? name : `${name} (${online ? 'online' : 'offline'})`;
  const dotSize = Math.max(7, Math.round(size * 0.32));

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className="relative rounded-full text-white inline-flex items-center justify-center font-semibold border-[1.5px] border-paper shadow-[0_0_0_1px_var(--chalk)] shrink-0 select-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}
    >
      <span aria-hidden="true">{initials(name)}</span>
      {online && (
        <span
          aria-hidden="true"
          className="absolute rounded-full border-[1.5px] border-paper"
          style={{
            width: dotSize,
            height: dotSize,
            background: 'var(--sage)',
            right: -1,
            bottom: -1,
          }}
        />
      )}
    </div>
  );
}

export function AvatarStack({
  names,
  online,
  size = 22,
  max = 3,
  label: labelPrefix = "Assigned to",
}: {
  names: string[];
  /** Parallel to `names` (same index = same person) — renders a presence dot per avatar when provided. */
  online?: boolean[];
  size?: number;
  max?: number;
  label?: string;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const label = extra > 0
    ? `${labelPrefix} ${shown.join(", ")} and ${extra} more`
    : `${labelPrefix} ${names.join(", ")}`;

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
          <Avatar name={n} size={size} online={online?.[i]} />
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

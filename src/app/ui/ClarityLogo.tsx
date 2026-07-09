export function ClarityLogo({ size = 28, color = '#3B82F6' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Checklist grid */}
      <rect x="6.5" y="6.5" width="4" height="4" rx="0.9" fill={color} />
      <rect x="11" y="6.5" width="4" height="4" rx="0.9" fill={color} />
      <rect x="15.5" y="6.5" width="4" height="4" rx="0.9" fill={color} />
      <rect x="6.5" y="11" width="4" height="8.5" rx="0.9" fill={color} />
      <rect x="11" y="11" width="8.5" height="8.5" rx="1.3" fill={color} />
      <path
        d="M12.9 15.3 L14.9 17.2 L18.1 13"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Magnifying glass ring */}
      <circle cx="13" cy="13" r="9.5" stroke={color} strokeWidth="2.8" fill="none" />
      {/* Handle */}
      <path d="M20 20 L27 27" stroke={color} strokeWidth="3.1" strokeLinecap="round" />
    </svg>
  );
}

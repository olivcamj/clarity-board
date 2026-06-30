export function ClarityLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Box background */}
      <rect width="28" height="28" rx="6" fill="#3B6FB5" fillOpacity="0.12" />
      {/* Magnifying glass lens — filled blue circle */}
      <circle cx="11" cy="11" r="7.5" fill="#3B6FB5" />
      {/* Grid dividers (white cross making 2×2 kanban grid) */}
      <line x1="11" y1="4" x2="11" y2="18" stroke="white" strokeWidth="1.1" />
      <line x1="4" y1="11" x2="18" y2="11" stroke="white" strokeWidth="1.1" />
      {/* Checkmark in bottom-right quadrant */}
      <path
        d="M12.5 13 L14 15 L17 11.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Handle */}
      <path d="M17 17 L22.5 22.5" stroke="#3B6FB5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

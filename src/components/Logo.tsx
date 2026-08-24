export function Logo({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden>
      <path
        d="M30 14.5A13 13 0 1 0 30 29.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="22" r="2.6" fill="currentColor" />
    </svg>
  );
}

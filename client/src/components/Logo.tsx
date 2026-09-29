export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M3 9.5c3-3 6 3 9 0s6 3 9 0M3 14.5c3-3 6 3 9 0s6 3 9 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <Logo className="size-5 text-accent" />
      Satin Road
    </span>
  );
}

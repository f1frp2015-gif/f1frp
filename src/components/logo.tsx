export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="112" className="fill-foreground" />
      <path
        d="M144 176h224M144 256h224M144 336h224"
        className="stroke-background"
        strokeWidth="32"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <LogoMark />
      <span className="text-[15px] font-bold tracking-tight">复材站</span>
    </div>
  );
}

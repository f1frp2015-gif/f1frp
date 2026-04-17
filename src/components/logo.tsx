export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="108" className="fill-foreground" />
      <rect x="128" y="136" width="256" height="28" rx="4" className="fill-background" />
      <rect x="128" y="204" width="256" height="28" rx="4" className="fill-background" opacity="0.6" />
      <rect x="242" y="272" width="28" height="168" rx="4" className="fill-background" />
      <line x1="164" y1="316" x2="348" y2="400" className="stroke-background" strokeWidth="24" strokeLinecap="round" opacity="0.6" />
      <line x1="348" y1="316" x2="164" y2="400" className="stroke-background" strokeWidth="24" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[15px] font-bold tracking-tight">复材站</span>
    </div>
  );
}

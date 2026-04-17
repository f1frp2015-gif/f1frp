export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="96" fill="currentColor" className="text-foreground" />
      <g stroke="currentColor" className="text-background" strokeWidth="36" strokeLinecap="round" fill="none">
        <line x1="96" y1="128" x2="288" y2="384" />
        <line x1="176" y1="96" x2="416" y2="336" />
        <line x1="224" y1="176" x2="416" y2="416" />
        <line x1="416" y1="128" x2="224" y2="384" />
        <line x1="336" y1="96" x2="96" y2="336" />
        <line x1="288" y1="176" x2="96" y2="416" />
      </g>
      <circle cx="256" cy="256" r="18" fill="currentColor" className="text-background" />
    </svg>
  );
}

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-bold leading-tight tracking-tight">
            F1FRP
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight tracking-widest uppercase">
            Composites
          </span>
        </div>
      )}
    </div>
  );
}

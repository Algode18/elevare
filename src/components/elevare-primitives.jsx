import { cn } from "@/lib/utils";

export function MatchRing({ value, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#matchGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="matchGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute font-mono text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function Chip({ children, tone = "default" }) {
  const tones = {
    default: "bg-surface-2 text-foreground border-border",
    lime: "bg-tag-hiring-bg text-tag-hiring-text border-transparent",
    cyan: "bg-tag-remote-bg text-tag-remote-text border-transparent",
    warn: "bg-tag-urgent-bg text-tag-urgent-text border-transparent",
    danger: "bg-destructive-bg text-destructive border-transparent",
    // Direct semantic aliases matching the Frosted Ivory tag spec
    remote: "bg-tag-remote-bg text-tag-remote-text border-transparent",
    fulltime: "bg-tag-fulltime-bg text-tag-fulltime-text border-transparent",
    hiring: "bg-tag-hiring-bg text-tag-hiring-text border-transparent",
    closed: "bg-tag-closed-bg text-tag-closed-text border-transparent",
    urgent: "bg-tag-urgent-bg text-tag-urgent-text border-transparent",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone] ?? tones.default)}>
      {children}
    </span>
  );
}
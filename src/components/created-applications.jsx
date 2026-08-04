import { useEffect, useMemo, useState } from "react";
import { useUser, useSession } from "@clerk/react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Rocket } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { getApplications, withdrawApplication } from "@/api/apiApplications";
import ApplicationPipelineCard from "./application-pipeline-card";
import ApplicationJourneyDrawer from "./application-journey-drawer";
import { stageColor } from "./pipeline-progress";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "applied", label: "Applied" },
  { key: "reviewed", label: "Reviewed" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

// Real 5-stage pipeline (no "HR" stage — that's not a field this schema
// tracks, so it isn't shown as if it were).
const STAGE_ORDER = ["applied", "reviewed", "interviewing", "offer", "hired"];
const STAGE_LABEL = { applied: "Applied", reviewed: "Reviewed", interviewing: "Interview", offer: "Offer", hired: "Hired" };

// Counts 0 → target once, on mount/target-change. Small local hook so the
// hero stat cards don't need an extra dependency.
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const HeroStat = ({ label, value, color, delay }) => {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-baseline gap-1.5"
    >
      <span className="text-lg font-bold leading-none" style={{ color }}>
        {count}
      </span>
      <span className="text-xs leading-none text-muted-foreground">{label}</span>
    </motion.div>
  );
};

// Career Pipeline dashboard — a layered-gradient hero with a live status
// pulse, animated real stat cards, a real "how far along" progress banner
// (computed from the furthest real stage any active application has
// reached), then search/filters/grid as before.
const CreatedApplications = () => {
  const { user } = useUser();
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [journeyApp, setJourneyApp] = useState(null);

  const { loading: loadingApplications, data: applications, fn: fnApplications } = useFetch(getApplications, {
    user_id: user.id,
  });

  useEffect(() => {
    fnApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWithdraw = async (applicationId) => {
    // Calling withdrawApplication directly (not through useFetch) because
    // useFetch's fn() catches errors internally and stores them in state
    // rather than rethrowing. A failed withdraw (e.g. blocked by a
    // Supabase RLS policy) needs to actually throw here so the card can
    // catch it and tell the user, instead of failing silently.
    const token = await session.getToken({ template: "supabase" });
    await withdrawApplication(token, { candidate_id: user.id }, applicationId);
    fnApplications();
  };

  const counts = useMemo(() => {
    const c = { all: applications?.length || 0 };
    FILTERS.slice(1).forEach((f) => (c[f.key] = 0));
    applications?.forEach((a) => {
      if (c[a.status] !== undefined) c[a.status] += 1;
    });
    return c;
  }, [applications]);

  // Real progress: the furthest real stage any non-rejected application
  // has reached. Not an average, not a fabricated "career score" — just
  // the best true data point you have, framed as momentum.
  const bestProgress = useMemo(() => {
    let bestIdx = -1;
    applications?.forEach((a) => {
      const idx = STAGE_ORDER.indexOf(a.status);
      if (idx > bestIdx) bestIdx = idx;
    });
    if (bestIdx < 0) return null;
    const pct = Math.round(((bestIdx + 1) / STAGE_ORDER.length) * 100);
    const nextStage = STAGE_ORDER[bestIdx + 1];
    return { bestIdx, pct, currentLabel: STAGE_LABEL[STAGE_ORDER[bestIdx]], nextLabel: nextStage ? STAGE_LABEL[nextStage] : null };
  }, [applications]);

  const filtered = useMemo(() => {
    let list = applications || [];
    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.job?.title?.toLowerCase().includes(q) || a.job?.company?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, filter, query]);

  if (loadingApplications !== false) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[210px] skeleton rounded-[var(--radius-card)]" />
        ))}
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Rocket className="h-5 w-5" />
        </div>
        <div className="font-medium">Your career journey starts here.</div>
        <p className="text-sm text-muted-foreground">Applications you submit will show up here.</p>
        <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
          Browse jobs →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero — a premium glass dashboard card, on brand with the rest of
          Elevare: deep charcoal base, faint purple/cyan glows instead of an
          engineering grid, and a gradient that carries through the status
          dot, progress bar and ring. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto mb-5 max-w-[1200px] overflow-hidden rounded-[var(--radius-modal)] border border-border bg-card p-7 shadow-[var(--shadow-2)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, color-mix(in oklab, var(--primary) 12%, transparent), transparent 45%), " +
            "radial-gradient(circle at top right, color-mix(in oklab, var(--accent-cyan) 10%, transparent), transparent 40%)",
        }}
      >
        {/* barely-there structural grid, hero-scoped only */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* soft decorative glow blobs — purple left, cyan right, kept low opacity */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-accent-cyan/15 blur-[90px]" />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-[1fr_280px] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
              />
              ✨ Career Tracker <span className="text-muted-foreground/70">· Live updates enabled</span>
            </div>

            <h1 className="mt-1.5 text-[28px] font-bold leading-tight tracking-tight text-heading sm:text-[32px]">
              Career Pipeline
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Track interviews, reviews and offers from one workspace.
            </p>

            {/* Compact inline stats — numbers only, no card boxes */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
              {FILTERS.slice(1).map((f, i) => (
                <HeroStat key={f.key} label={f.label} value={counts[f.key] || 0} color={stageColor(f.key)} delay={i * 0.06} />
              ))}
            </div>

            {/* Progress — 40px tall, real furthest-stage-reached */}
            {bestProgress && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Hiring progress
                    {bestProgress.nextLabel && (
                      <>
                        {" "}
                        · next: <span className="text-heading">{bestProgress.nextLabel}</span>
                      </>
                    )}
                  </span>
                  <span className="font-semibold text-heading">{bestProgress.pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full shadow-[var(--shadow-glow-primary)]"
                    style={{ background: "linear-gradient(90deg, #6F56F8, #5C45E4, #4F8EF7)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${bestProgress.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right panel — cyan accent divider + Live Hiring Signal ring.
              Only real fields: current stage, next stage, % through the
              real stage list. Deliberately no "ETA 3-7 days" — nothing in
              this schema records per-stage timestamps, so a days estimate
              would be invented, not tracked. */}
          {bestProgress ? (
            <div
              className="relative flex items-center gap-5 rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 sm:border-l-0 sm:pl-6"
            >
              <div className="absolute inset-y-3 -left-px hidden w-px bg-gradient-to-b from-transparent via-border to-transparent sm:block" />
              <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90">
                <defs>
                  <linearGradient id="pipelineRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6F56F8" />
                    <stop offset="50%" stopColor="#5C45E4" />
                    <stop offset="100%" stopColor="#4F8EF7" />
                  </linearGradient>
                </defs>
                <circle cx="38" cy="38" r="32" fill="none" stroke="var(--border)" strokeWidth="8" />
                <motion.circle
                  cx="38"
                  cy="38"
                  r="32"
                  fill="none"
                  stroke="url(#pipelineRingGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - bestProgress.pct / 100) }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
                <text
                  x="38"
                  y="38"
                  transform="rotate(90 38 38)"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--heading)"
                  fontSize="16"
                  fontWeight="700"
                >
                  {bestProgress.pct}%
                </text>
              </svg>

              <div className="text-xs leading-relaxed">
                <div className="text-muted-foreground/70">Current stage</div>
                <div className="font-semibold text-heading">{bestProgress.currentLabel}</div>
                {bestProgress.nextLabel && (
                  <>
                    <div className="mt-1.5 text-muted-foreground/70">
                      Next: <span className="text-accent-cyan">{bestProgress.nextLabel}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden text-xs text-muted-foreground/70 sm:block">No active pipeline yet.</div>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <div className="mb-4 flex justify-end">
        <div className="flex h-9 items-center gap-2 rounded-[var(--radius-input)] border border-input bg-surface-2 px-3 transition-colors focus-within:border-ring focus-within:shadow-[0_0_0_3px_var(--ring)/15]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications…"
            className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:w-56"
          />
        </div>
      </div>

      {/* Filter tabs — gradient active state */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "text-primary-foreground shadow-[0_4px_16px_-4px_rgba(111,86,248,0.5)]"
                  : "border border-border text-muted-foreground hover:-translate-y-0.5 hover:border-border-strong"
              }`}
              style={isActive ? { background: "linear-gradient(90deg, #6F56F8, #5C45E4)" } : undefined}
            >
              {f.label} <span className="opacity-70">({counts[f.key] ?? 0})</span>
            </button>
          );
        })}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filtered.map((application) => (
            <ApplicationPipelineCard
              key={application.id}
              application={application}
              onOpenJourney={setJourneyApp}
              onWithdrawn={handleWithdraw}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="rounded-[var(--radius-card)] border border-border py-10 text-center text-sm text-muted-foreground">
          No applications match that filter.
        </div>
      )}

      <ApplicationJourneyDrawer
        open={!!journeyApp}
        onOpenChange={(v) => !v && setJourneyApp(null)}
        application={journeyApp}
      />
    </div>
  );
};

export default CreatedApplications;
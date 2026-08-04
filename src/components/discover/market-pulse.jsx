import { useEffect, useMemo } from "react";
import {
  Briefcase,
  Building2,
  Globe2,
  Sparkles,
  MapPin,
  Radio,
  ArrowRight,
  LayoutGrid,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { getJobs } from "@/api/apiJobs";

// Career Intelligence strip for Discover Jobs — everything here is derived
// from the *full* set of currently-open jobs (unfiltered by the search bar
// above), so it stays a stable "state of the market" snapshot while the
// grid above reacts to search/filters. No fabricated percentages: anything
// we can't honestly compute from the jobs table (experience distribution,
// week-over-week trend deltas) is simply left out rather than faked.

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="hairline rounded-2xl bg-surface/60 p-3.5 sm:p-5">
      {/* Mobile — compact horizontal row: icon beside value/label instead of stacked above it */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-semibold leading-none">{value}</span>
            {sub && <span className="text-[10px] font-medium text-cyan">{sub}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>

      {/* Desktop — original vertical layout, unchanged */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          {sub && <span className="text-xs font-medium text-cyan">{sub}</span>}
        </div>
        <div className="mt-3 font-mono text-3xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Bar({ pct }) {
  return (
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-700"
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </div>
  );
}

const MarketPulse = ({ onOpenJob }) => {
  const { data: jobs, loading, fn: fnAllJobs } = useFetch(getJobs, {});

  useEffect(() => {
    fnAllJobs();
  }, []);

  const stats = useMemo(() => {
    if (!jobs?.length) return null;

    const totalJobs = jobs.length;
    const remoteJobs = jobs.filter((j) => j.work_mode === "Remote").length;
    const internships = jobs.filter((j) => j.job_type === "Internship").length;
    const newToday = jobs.filter((j) => isToday(j.created_at)).length;
    const companyCount = new Set(jobs.map((j) => j.company?.name).filter(Boolean)).size;

    const skillCounts = {};
    jobs.forEach((j) => {
      (j.skills || []).forEach((s) => {
        const key = s.trim();
        if (!key) return;
        skillCounts[key] = (skillCounts[key] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill, count]) => ({ skill, count, pct: Math.round((count / totalJobs) * 100) }));

    const locationCounts = {};
    jobs.forEach((j) => {
      const key = j.location?.trim();
      if (!key) return;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxLocationCount = topLocations[0]?.[1] || 1;

    // Employment-type breakdown — a straight count of the job_type field,
    // so it's accurate no matter how few jobs are open (unlike the old
    // salary-average cards, which read as noise with a small sample).
    const employmentTypeCounts = {};
    jobs.forEach((j) => {
      const key = j.job_type?.trim();
      if (!key) return;
      employmentTypeCounts[key] = (employmentTypeCounts[key] || 0) + 1;
    });
    const employmentTypes = Object.entries(employmentTypeCounts).sort((a, b) => b[1] - a[1]);
    const maxEmploymentTypeCount = employmentTypes[0]?.[1] || 1;

    const liveFeed = [...jobs]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);

    // Today's snapshot — every field here is a direct count/lookup over
    // jobs posted today, not an estimate.
    const todaysJobs = jobs.filter((j) => isToday(j.created_at));
    const newCompaniesToday = new Set(todaysJobs.map((j) => j.company?.name).filter(Boolean)).size;
    const mostHiringType = employmentTypes[0]?.[0] || null;
    const highestPaying = [...jobs]
      .filter((j) => j.salary_max)
      .sort((a, b) => Number(b.salary_max) - Number(a.salary_max))[0];
    const mostActiveLocation = topLocations[0]?.[0] || null;

    return {
      totalJobs,
      remoteJobs,
      internships,
      newToday,
      companyCount,
      topSkills,
      topLocations,
      maxLocationCount,
      employmentTypes,
      maxEmploymentTypeCount,
      liveFeed,
      snapshot: {
        newToday,
        newCompaniesToday,
        mostHiringType,
        highestPaying,
        mostActiveLocation,
      },
    };
  }, [jobs]);

  if (loading !== false && !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="hairline h-28 animate-pulse rounded-2xl bg-surface/40" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10">
      {/* Hiring activity */}
      <div>
        <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Hiring Activity
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Open Roles" value={stats.totalJobs} sub={stats.newToday ? `+${stats.newToday} today` : null} />
          <StatCard icon={Building2} label="Companies Hiring" value={stats.companyCount} />
          <StatCard icon={Globe2} label="Remote Jobs" value={stats.remoteJobs} />
          <StatCard icon={Sparkles} label="Internships" value={stats.internships} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Skill demand */}
        <div className="hairline rounded-2xl bg-surface/60 p-6">
          <h3 className="font-display text-xl">Most In-Demand Skills</h3>
          <p className="mt-1 text-xs text-muted-foreground">Share of open roles that list this skill.</p>
          {stats.topSkills.length ? (
            <ul className="mt-5 space-y-4">
              {stats.topSkills.map((s) => (
                <li key={s.skill}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{s.skill}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.pct}%</span>
                  </div>
                  <Bar pct={s.pct} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Not enough tagged skills yet.</p>
          )}
        </div>

        {/* Hiring locations */}
        <div className="hairline rounded-2xl bg-surface/60 p-6">
          <h3 className="font-display text-xl">Hiring Locations</h3>
          <p className="mt-1 text-xs text-muted-foreground">Where open roles are concentrated right now.</p>
          {stats.topLocations.length ? (
            <ul className="mt-5 space-y-4">
              {stats.topLocations.map(([loc, count]) => (
                <li key={loc}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {loc}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {count} job{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Bar pct={Math.round((count / stats.maxLocationCount) * 100)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No location data yet.</p>
          )}
        </div>
      </div>

      {/* Hiring breakdown — a plain count of the job_type field. Replaces
          the old salary-average cards, which read as noise once there were
          only a handful of open roles to average across. */}
      {stats.employmentTypes.length > 0 && (
        <div className="hairline rounded-2xl bg-surface/60 p-6">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h3 className="font-display text-xl">Hiring Breakdown</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Employment type across open roles right now.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.employmentTypes.map(([type, count]) => (
              <li key={type} className="hairline rounded-xl bg-background/40 p-4">
                <div className="font-mono text-2xl font-semibold">{count}</div>
                <p className="mt-1 text-xs text-muted-foreground">{type}</p>
                <Bar pct={Math.round((count / stats.maxEmploymentTypeCount) * 100)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's market snapshot — every field is a direct count or lookup
          over jobs posted today; nothing here is estimated. */}
      <div className="hairline rounded-2xl bg-surface/60 p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-display text-xl">Today's Market</h3>
        </div>
        {/* Mobile — icon-led rows, matching the StatCard treatment above
            instead of a plain divided text list. */}
        <div className="mt-5 space-y-2.5 sm:hidden">
          {[
            { icon: Sparkles, value: `+${stats.snapshot.newToday}`, label: "New jobs today" },
            { icon: Building2, value: `+${stats.snapshot.newCompaniesToday}`, label: "Companies posting today" },
            { icon: Briefcase, value: stats.snapshot.mostHiringType || "—", label: "Most hiring for" },
            { icon: IndianRupee, value: stats.snapshot.highestPaying?.title || "—", label: "Highest paying role" },
            { icon: MapPin, value: stats.snapshot.mostActiveLocation || "—", label: "Most active location" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="hairline flex items-center gap-3 rounded-xl bg-background/40 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{value}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/tablet — original layout, unchanged */}
        <div className="mt-5 hidden sm:grid sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          <div>
            <div className="font-mono text-2xl font-semibold">+{stats.snapshot.newToday}</div>
            <p className="mt-1 text-xs text-muted-foreground">New jobs today</p>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold">+{stats.snapshot.newCompaniesToday}</div>
            <p className="mt-1 text-xs text-muted-foreground">Companies posting today</p>
          </div>
          <div>
            <div className="truncate text-lg font-semibold">{stats.snapshot.mostHiringType || "—"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Most hiring for</p>
          </div>
          <div>
            <div className="truncate text-lg font-semibold">{stats.snapshot.highestPaying?.title || "—"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Highest paying role</p>
          </div>
          <div>
            <div className="truncate text-lg font-semibold">{stats.snapshot.mostActiveLocation || "—"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Most active location</p>
          </div>
        </div>
      </div>

      {/* Recent hiring activity */}
      {stats.liveFeed.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h3 className="font-display text-xl">Recent Hiring Activity</h3>
          </div>
          <div className="hairline divide-y divide-border rounded-2xl bg-surface/60">
            {stats.liveFeed.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onOpenJob?.(job.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {job.title} <span className="text-muted-foreground">· {job.company?.name || "Company"}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(job.created_at)}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                  Apply <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPulse;
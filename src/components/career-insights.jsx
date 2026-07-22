import { useMemo } from "react";
import { TrendingUp, MapPinIcon, Building2, Sparkles, Radio } from "lucide-react";

// Real insights computed from your own open jobs — no AI, no fabricated
// percentages. Falls back to a friendly empty state per card until there's
// enough data (e.g. skills are only populated once employers tag them when
// posting a job — see pages/employer/post-job.jsx).
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RankedBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.max(pct, 6)}%` }} />
    </div>
  );
}

const CareerInsights = ({ jobs, loading }) => {
  const stats = useMemo(() => {
    if (!jobs?.length) return null;

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
      .slice(0, 4);
    const maxSkillCount = topSkills[0]?.[1] || 0;

    const titleCounts = {};
    jobs.forEach((j) => {
      const key = j.title?.trim();
      if (!key) return;
      titleCounts[key] = (titleCounts[key] || 0) + 1;
    });
    const topTitles = Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const maxTitleCount = topTitles[0]?.[1] || 0;

    const locationCounts = {};
    jobs.forEach((j) => {
      const key = j.location?.trim();
      if (!key) return;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const uniqueCompanies = new Set(jobs.map((j) => j.company?.name).filter(Boolean));

    // jobs already arrive sorted newest-first (see api/apiJobs.js getJobs),
    // but sort defensively here too in case this component is ever fed an
    // unsorted list from somewhere else.
    const mostRecent = [...jobs].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )[0];

    return {
      topSkills,
      maxSkillCount,
      topTitles,
      maxTitleCount,
      topLocations,
      totalJobs: jobs.length,
      companyCount: uniqueCompanies.size,
      mostRecent,
    };
  }, [jobs]);

  const cards = [
    {
      icon: Sparkles,
      title: "Most In-Demand Skills",
      body: stats?.topSkills?.length ? (
        <ul className="mt-2 space-y-2.5 text-sm">
          {stats.topSkills.map(([skill, count]) => (
            <li key={skill}>
              <div className="flex items-center justify-between">
                <span>{skill}</span>
                <span className="text-xs text-muted-foreground">{count} open role{count === 1 ? "" : "s"}</span>
              </div>
              <RankedBar value={count} max={stats.maxSkillCount} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Not enough tagged skills yet — add skills when posting a job to power this.
        </p>
      ),
    },
    {
      icon: TrendingUp,
      title: "Most Common Roles",
      body: stats?.topTitles?.length ? (
        <ul className="mt-2 space-y-2.5 text-sm">
          {stats.topTitles.map(([title, count]) => (
            <li key={title}>
              <div className="flex items-center justify-between">
                <span className="truncate pr-2">{title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{count} open</span>
              </div>
              <RankedBar value={count} max={stats.maxTitleCount} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No open roles yet.</p>
      ),
    },
    {
      icon: MapPinIcon,
      title: "Top Locations",
      body: stats?.topLocations?.length ? (
        <ul className="mt-2 space-y-1.5 text-sm">
          {stats.topLocations.map(([location, count]) => (
            <li key={location} className="flex items-center justify-between">
              <span className="truncate pr-2">{location}</span>
              <span className="text-xs text-muted-foreground shrink-0">{count} open</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No open roles yet.</p>
      ),
    },
    {
      icon: Building2,
      title: "Hiring Now",
      body: stats ? (
        <div className="mt-2">
          <div className="text-3xl font-mono font-semibold">{stats.totalJobs}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            open roles across {stats.companyCount} compan{stats.companyCount === 1 ? "y" : "ies"} right now.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No open roles yet.</p>
      ),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Career Insights — Live
        </div>
        <h2 className="mt-3 font-display text-5xl">More than a job board.</h2>
        <p className="mt-3 text-xs text-muted-foreground">
          Computed live from open roles on Elevare right now.
        </p>
      </div>

      {loading !== false && (
        <div className="space-y-4">
          <div className="hairline h-16 animate-pulse rounded-xl bg-surface/40" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="hairline h-40 animate-pulse rounded-xl bg-surface/40" />
            ))}
          </div>
        </div>
      )}

      {loading === false && (
        <div className="space-y-4">
          {stats?.mostRecent && (
            <div className="hairline flex flex-wrap items-center gap-3 rounded-xl bg-primary/5 px-5 py-4">
              <Radio className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">
                <span className="font-medium">Just posted:</span>{" "}
                {stats.mostRecent.title} at {stats.mostRecent.company?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(stats.mostRecent.created_at)}
              </span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.title} className="hairline rounded-xl bg-surface/60 p-6">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                {c.body}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CareerInsights;
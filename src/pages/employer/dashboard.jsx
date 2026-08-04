import { getMyJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import {
  PenBox,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Rocket,
} from "lucide-react";
import { getEmployerDashboardData, formatRelativeTime } from "@/lib/dashboard-messages";

const statusTone = {
  applied: "text-muted-foreground",
  reviewed: "text-cyan",
  interviewing: "text-primary",
  offer: "text-lime",
  hired: "text-lime",
  rejected: "text-destructive",
};

const activityIcon = {
  job: Rocket,
  applicant: UserPlus,
};

const SectionHeader = ({ label, action }) => (
  <div className="mb-3 flex items-center justify-between">
    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    {action}
  </div>
);

const ViewAll = ({ to, label = "View All →" }) => (
  <Link to={to} className="text-xs text-muted-foreground hover:text-foreground">
    {label}
  </Link>
);

const EmployerDashboardPage = () => {
  const { user, isLoaded } = useUser();
  const { data: jobs, loading, fn } = useFetch(getMyJobs, { recruiter_id: user?.id });

  useEffect(() => {
    if (isLoaded && user) fn();
  }, [isLoaded]);

  if (!isLoaded || loading !== false) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  const data = getEmployerDashboardData({ user, jobs });

  // Empty state — no jobs posted yet, keep it to a single focused prompt.
  if (data.isEmpty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Dashboard</div>
        <h1 className="font-display text-4xl">{data.greeting}</h1>
        <p className="max-w-sm text-muted-foreground">{data.subtitle}</p>
        <Link
          to={data.cta.to}
          className="mt-2 flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <PenBox className="h-3.5 w-3.5" /> {data.cta.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero — compact single line, no wasted vertical space */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight sm:text-3xl">{data.greeting}</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{data.statLine}</p>
        </div>
        <Link
          to={data.cta.to}
          className="flex w-fit shrink-0 items-center gap-2 self-end rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:self-auto"
        >
          <PenBox className="h-3.5 w-3.5" /> {data.cta.label}
        </Link>
      </section>


      {/* Hiring overview KPIs */}
      <section>
        <SectionHeader label="Hiring Overview" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {data.kpis.map((k) => (
            <Link key={k.label} to={k.to} className="hairline hover-lift group rounded-xl bg-surface p-3.5 sm:p-4">
              <div className="text-xs text-muted-foreground sm:text-sm">{k.label}</div>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl">{k.value}</div>
              <div className="relative mt-1.5 flex h-4 items-center text-xs">
                <span className="truncate text-muted-foreground transition-opacity group-hover:opacity-0">
                  {k.sublabel}
                </span>
                <span className="absolute inset-y-0 left-0 hidden items-center text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                  {k.hint}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Needs attention */}
      {data.needsAttention.length > 0 && (
        <section>
          <SectionHeader label="Needs Attention" action={<ViewAll to="/employer/jobs" />} />
          <div className="grid gap-3 sm:grid-cols-2">
            {data.needsAttention.map((item, i) => (
              <Link
                key={i}
                to={item.to}
                className={`hairline hover-lift flex items-start gap-3 rounded-xl bg-surface p-4 ${
                  item.tone === "warning" ? "border-l-2 border-l-warning" : "border-l-2 border-l-lime"
                }`}
              >
                {item.tone === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.detail}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hiring pipeline funnel — each stage links to filtered applications */}
      <section>
        <SectionHeader label="Hiring Pipeline" />
        <div className="hairline rounded-xl bg-surface p-5">
          {/* Mobile: stacked rows, one stage per line — the 5-column funnel is too cramped on narrow screens */}
          <div className="flex flex-col gap-4 sm:hidden">
            {data.pipeline.map((stage) => {
              const max = data.pipeline[0].count || 1;
              const widthPct = Math.max(8, Math.round((stage.count / max) * 100));
              return (
                <Link
                  key={stage.stage}
                  to={`/employer/applications?stage=${stage.status}`}
                  className="group -m-1 rounded-md p-1 hover:bg-surface-2/60"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground group-hover:text-foreground">{stage.stage}</span>
                    <span className="font-mono text-lg">{stage.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* sm and up: original horizontal funnel with arrows between stages */}
          <div className="hidden items-stretch gap-2 sm:flex">
            {data.pipeline.map((stage, i) => {
              const max = data.pipeline[0].count || 1;
              const widthPct = Math.max(8, Math.round((stage.count / max) * 100));
              return (
                <div key={stage.stage} className="flex flex-1 items-center gap-2">
                  <Link
                    to={`/employer/applications?stage=${stage.status}`}
                    className="group -m-1 flex-1 rounded-md p-1 hover:bg-surface-2/60"
                  >
                    <div className="mb-2 text-xs text-muted-foreground group-hover:text-foreground">
                      {stage.stage}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="mt-2 font-mono text-2xl">{stage.count}</div>
                  </Link>
                  {i < data.pipeline.length - 1 && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent applicants + recent jobs */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="hairline rounded-xl bg-surface p-4 lg:col-span-7">
          <SectionHeader
            label="Recent Applicants"
            action={<ViewAll to="/employer/applications" />}
          />
          {data.recentApplicants.length ? (
            <div className="space-y-1.5">
              {data.recentApplicants.map((a) => (
                <Link
                  key={a.id}
                  to={`/employer/jobs/${a.job_id}/applicants?applicant=${a.id}`}
                  className="hover-lift flex items-center gap-3 rounded-lg border border-transparent bg-background/40 p-2.5 hover:border-border"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium">
                    {a.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.job_title} · Applied {formatRelativeTime(a.created_at)}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs capitalize ${statusTone[a.status] || "text-muted-foreground"}`}>
                    {a.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Applicants will show up here once candidates apply.
            </div>
          )}
        </div>

        <div className="hairline rounded-xl bg-surface p-4 lg:col-span-5">
          <SectionHeader
            label="Recent Jobs"
            action={<ViewAll to="/employer/jobs" label="Manage All →" />}
          />
          {data.recentJobs.length ? (
            <div className="space-y-1.5">
              {data.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/employer/jobs/${job.id}/applicants`}
                  className="hover-lift flex items-center gap-3 rounded-lg border border-transparent bg-background/40 p-2.5 hover:border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{job.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {job.applications?.length || 0} applicant{job.applications?.length === 1 ? "" : "s"} · Posted{" "}
                      {formatRelativeTime(job.created_at)}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                      job.isOpen ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {job.isOpen ? "Open" : "Closed"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No jobs posted yet.
            </div>
          )}
        </div>
      </section>

      {/* Recent activity feed */}
      {data.activity.length > 0 && (
        <section>
          <SectionHeader label="Recent Activity" />
          <div className="hairline rounded-xl bg-surface p-4">
            <div className="divide-y divide-border/60">
              {data.activity.map((event) => {
                const Icon = activityIcon[event.icon] || UserPlus;
                return (
                  <div key={event.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm">{event.text}</div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(event.at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EmployerDashboardPage;
import { getApplications } from "@/api/apiApplications";
import { getJobs, getSavedJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import useProfile from "@/hooks/use-profile";
import useResumes from "@/hooks/use-resumes";
import { getProfileCompletion } from "@/lib/profile-completion";
import { formatRelativeTime } from "@/lib/dashboard-messages";
import { useUser } from "@clerk/react";
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { motion } from "framer-motion";
import {
  Send,
  Bookmark,
  CalendarCheck,
  FileText,
  ArrowRight,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  Circle,
  User,
  Building2,
  Sparkles,
  MapPin,
  Phone,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import JobMatchTile from "@/components/discover/job-match-tile";

// ---------------------------------------------------------------------------
// Status system — every status gets a consistent color meaning across the
// whole dashboard (pipeline dots, badges, funnel, cards).
// ---------------------------------------------------------------------------
const STATUS = {
  applied: { label: "Applied", color: "#6F56F8", soft: "bg-primary/10 text-primary border-primary/25" },
  reviewed: { label: "In Review", color: "#F59E0B", soft: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  interviewing: { label: "Interview", color: "#4F8EF7", soft: "bg-cyan/10 text-cyan border-cyan/25" },
  offer: { label: "Offer", color: "#10B981", soft: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  hired: { label: "Hired", color: "#10B981", soft: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  rejected: { label: "Rejected", color: "#EF4444", soft: "bg-rose-500/10 text-rose-600 border-rose-500/25" },
};
const PIPELINE_STAGES = ["applied", "reviewed", "interviewing", "offer"];

const timeOfDayGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

// Animation choreography — sections fade + rise in on load, staggered.
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const { profile, loading: loadingProfile } = useProfile();
  const { resumes } = useResumes();
  const navigate = useNavigate();

  const mySkills = useMemo(
    () => (Array.isArray(profile?.skills) ? profile.skills.map((s) => String(s).toLowerCase()) : []),
    [profile]
  );

  const { data: applications, loading: loadingApps, fn: fnApps } = useFetch(getApplications, {
    user_id: user?.id,
  });
  const { data: jobs, loading: loadingJobs, fn: fnJobs } = useFetch(getJobs, {});
  const { data: savedJobs, loading: loadingSaved, fn: fnSaved } = useFetch(getSavedJobs);

  useEffect(() => {
    if (isLoaded && user) {
      fnApps();
      fnJobs();
      fnSaved();
    }
  }, [isLoaded]);

  const savedJobIds = useMemo(
    () => new Set((savedJobs || []).map((s) => s.job_id)),
    [savedJobs]
  );

  const interviewCount = useMemo(
    () => (applications || []).filter((a) => a.status === "interviewing").length,
    [applications]
  );

  const completion = getProfileCompletion(profile, resumes.length);
  const firstName = user?.firstName || user?.fullName || "there";

  // Only the single most time-sensitive application — an active
  // interview. This is intentionally NOT "most recent application"
  // (that's already the top row of Recent Applications below); it only
  // shows up here when there's something genuinely urgent to act on, so
  // it never just repeats what the tracker already shows.
  const urgentApplication = useMemo(() => {
    if (!applications?.length) return null;
    const interviewing = applications.filter((a) => a.status === "interviewing");
    if (!interviewing.length) return null;
    return [...interviewing].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [applications]);

  // "Today's Focus" — a short, honest checklist built only from real
  // profile/application state. Nothing here is a fabricated target.
  const focusItems = useMemo(() => {
    const items = [];
    items.push({
      id: "resume",
      label: "Upload your resume",
      done: !!profile?.resume_url,
      to: "/resume",
    });
    items.push({
      id: "profile",
      label: "Complete your profile",
      done: completion === 100,
      to: "/profile",
    });
    items.push({
      id: "apply",
      label: (applications?.length ?? 0) > 0 ? "Keep applying to new roles" : "Apply to your first job",
      done: (applications?.length ?? 0) > 0,
      to: "/dashboard/jobs",
    });
    if ((savedJobs?.length ?? 0) > 0) {
      items.push({
        id: "saved",
        label: "Review your saved jobs",
        done: false,
        to: "/saved",
      });
    }
    return items;
  }, [profile, completion, applications, savedJobs]);

  // Application Insights — a funnel built purely from the candidate's own
  // application statuses. This is deliberately different from both the
  // hero's raw "Applications" count and the per-application pipeline
  // dots in Recent Applications: those show "what" and "one row's
  // progress", this shows "how the whole batch is trending" — how many
  // are stuck at Applied vs moving to Review/Interview vs closed out.
  const funnel = useMemo(() => {
    const apps = applications || [];
    const total = apps.length;
    const stageCount = (stage) => apps.filter((a) => a.status === stage).length;
    const advanced = apps.filter((a) =>
      ["reviewed", "interviewing", "offer", "hired"].includes(a.status)
    ).length;
    return {
      total,
      applied: stageCount("applied"),
      reviewed: stageCount("reviewed"),
      interviewing: stageCount("interviewing"),
      offer: stageCount("offer") + stageCount("hired"),
      rejected: stageCount("rejected"),
      responseRate: total > 0 ? Math.round((advanced / total) * 100) : null,
    };
  }, [applications]);

  // Lightweight activity feed — built from data we already have (no
  // separate activity log table): most recent applications, most recent
  // saved jobs, and a profile-updated entry, merged and sorted by time.
  const activity = useMemo(() => {
    const events = [];
    (applications || []).slice(0, 3).forEach((a) => {
      events.push({
        id: `app-${a.id}`,
        at: a.created_at,
        label: `Applied to ${a.job?.title || "a job"} at ${a.job?.company?.name || "a company"}`,
        icon: Send,
        color: STATUS.applied.color,
      });
    });
    (savedJobs || []).slice(0, 3).forEach((s) => {
      events.push({
        id: `saved-${s.id}`,
        at: s.created_at,
        label: `Saved ${s.job?.title || "a job"} at ${s.job?.company?.name || "a company"}`,
        icon: Bookmark,
        color: "#4F8EF7",
      });
    });
    if (profile?.updated_at) {
      events.push({
        id: "profile-updated",
        at: profile.updated_at,
        label: profile.resume_url ? "Updated resume / profile" : "Updated profile",
        icon: User,
        color: "#10B981",
      });
    }
    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5);
  }, [applications, savedJobs, profile]);

  if (!isLoaded || loadingProfile) return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                             */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-border card-surface p-8 sm:p-10"
      >
        <div className="mesh-bg pointer-events-none absolute inset-0 opacity-70" />
        <motion.div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan/15 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Career Workspace
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {timeOfDayGreeting()}, {firstName} <span className="align-middle">👋</span>
            </h1>

            {/* Single-line urgent banner — replaces the old standalone
                "Continue Journey" card. Only appears when there's a real
                interview to act on, so it never just repeats the most
                recent row already visible in Recent Applications. */}
            {urgentApplication ? (
              <Link
                to="/applications"
                className="group mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 py-1.5 pl-1.5 pr-3 text-sm text-cyan transition-colors hover:bg-cyan/15"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/20">
                  <CalendarCheck className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">
                  Interview stage — {urgentApplication.job?.title || "a role"} at{" "}
                  {urgentApplication.job?.company?.name || "a company"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ) : (
              <p className="mt-2 max-w-md text-muted-foreground">
                Here's where you left off — pick it back up, or find what's next.
              </p>
            )}
          </div>
          <Link
            to="/dashboard/jobs"
            className="group flex w-fit shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_0_0_rgba(124,92,255,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(124,92,255,0.55)]"
          >
            Browse Jobs
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Quick stat strip inside hero — compact, not four competing cards */}
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat icon={Send} label="Applications" value={applications?.length ?? "–"} to="/applications" accent="#6F56F8" />
          <MiniStat icon={Bookmark} label="Saved" value={savedJobs?.length ?? "–"} to="/saved" accent="#4F8EF7" />
          <MiniStat icon={CalendarCheck} label="Interviews" value={interviewCount} to="/applications" accent="#F59E0B" />
          <MiniStat
            icon={FileText}
            label="Resume"
            value={profile?.resume_url ? "Ready" : "Missing"}
            to="/resume"
            accent={profile?.resume_url ? "#10B981" : "#EF4444"}
          />
        </div>
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* TODAY'S FOCUS + APPLICATION INSIGHTS                             */}
      {/* Insights is new: a funnel across every application, distinct     */}
      {/* from the per-row pipeline dots further down.                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={item}>
          <TodaysFocusCard items={focusItems} />
        </motion.div>
        <motion.div variants={item}>
          <InsightsCard funnel={funnel} />
        </motion.div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RECOMMENDED JOBS                                                 */}
      {/* ---------------------------------------------------------------- */}
     <motion.section variants={item}>
        <SectionHeader
          eyebrow="Curated"
          title="Recommended for you"
          to={jobs?.length ? "/dashboard/jobs" : null}
        />
        {loadingJobs !== false ? (
          <BarLoader width={"100%"} color="var(--primary)" />
        ) : jobs?.length ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 3).map((j, i) => (
              <JobMatchTile
                key={j.id}
                job={j}
                index={i}
                savedInit={savedJobIds.has(j.id)}
                mySkills={mySkills}
                onOpen={(id) => navigate(`/dashboard/jobs?job=${id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No open jobs right now." />
        )}
      </motion.section>

      {/* ---------------------------------------------------------------- */}
      {/* APPLICATION PIPELINE — the one place full application history    */}
      {/* lives on this dashboard.                                         */}
      {/* ---------------------------------------------------------------- */}
      <motion.section variants={item}>
        <SectionHeader
          eyebrow="Tracking"
          title="Recent applications"
          to={applications?.length ? "/applications" : null}
        />
        {loadingApps !== false ? (
          <BarLoader width={"100%"} color="var(--primary)" />
        ) : applications?.length ? (
          <div className="flex flex-col gap-3">
            {applications.slice(0, 5).map((a, i) => (
              <ApplicationRow key={a.id} application={a} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState text="No applications yet." cta={{ to: "/dashboard/jobs", label: "Browse Jobs" }} />
        )}
      </motion.section>

      {/* ---------------------------------------------------------------- */}
      {/* RESUME + PROFILE + SHORTLIST                                     */}
      {/* Saved jobs live here as a compact list, not a repeated card grid */}
      {/* — the full experience already has its own page at /saved.        */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <motion.div variants={item}>
          <ResumeCard profile={profile} />
        </motion.div>
        <motion.div variants={item}>
          <ProfileCompletionCard profile={profile} completion={completion} />
        </motion.div>
        <motion.div variants={item} className="sm:col-span-2 xl:col-span-1">
          <ShortlistCard savedJobs={savedJobs} loading={loadingSaved} />
        </motion.div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RECENT ACTIVITY                                                  */}
      {/* ---------------------------------------------------------------- */}
      <motion.section variants={item}>
        <SectionHeader eyebrow="Timeline" title="Recent activity" />
        {activity.length ? (
          <div className="hairline overflow-hidden rounded-[var(--radius-card)] card-surface">
            {activity.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * i }}
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60 ${
                  i !== activity.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${e.color}1a`, color: e.color }}
                  >
                    <e.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <span className="flex-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  {e.label}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(e.at)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState text="Nothing here yet — start by browsing jobs." cta={{ to: "/dashboard/jobs", label: "Browse Jobs" }} />
        )}
      </motion.section>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MiniStat = ({ icon: Icon, label, value, to, accent }) => (
  <Link
    to={to}
    className="group relative flex items-center gap-2.5 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-2)]"
  >
    <div
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110"
      style={{ backgroundColor: `${accent}1f`, color: accent }}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <div className="font-display text-xl leading-none">{value}</div>
      <div className="mt-1 truncate text-[11px] text-muted-foreground">{label}</div>
    </div>
    <ArrowUpRight className="ml-auto hidden h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block" />
  </Link>
);

const SectionHeader = ({ eyebrow, title, to }) => (
  <div className="mb-4 flex items-end justify-between">
    <div>
      {eyebrow && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-primary/80">{eyebrow}</div>
      )}
      <h2 className="mt-0.5 text-lg font-semibold">{title}</h2>
    </div>
    {to && (
      <Link
        to={to}
        className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        View all
        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

const TodaysFocusCard = ({ items }) => (
  <div className="hover-lift flex h-full flex-col rounded-[var(--radius-card)] border border-border card-surface p-6">
    <div className="text-[11px] font-medium uppercase tracking-wider text-primary/80">Today's Focus</div>
    <div className="mt-4 flex flex-1 flex-col gap-1">
      {items.map((it) => (
        <Link
          key={it.id}
          to={it.to}
          className="group flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2/60"
        >
          {it.done ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
          <span
            className={`flex-1 text-sm transition-colors ${
              it.done ? "text-muted-foreground line-through decoration-muted-foreground/50" : "group-hover:text-foreground"
            }`}
          >
            {it.label}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  </div>
);

// New — an application funnel built only from statuses the candidate
// already has. Answers a question nothing else on the dashboard answers:
// "of everything I've applied to, how much is actually moving forward?"
const InsightsCard = ({ funnel }) => {
  const stages = [
    { key: "applied", label: "Applied", color: STATUS.applied.color, count: funnel.applied },
    { key: "reviewed", label: "In Review", color: STATUS.reviewed.color, count: funnel.reviewed },
    { key: "interviewing", label: "Interview", color: STATUS.interviewing.color, count: funnel.interviewing },
    { key: "offer", label: "Offer", color: STATUS.offer.color, count: funnel.offer },
  ];
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <div className="hover-lift flex h-full flex-col rounded-[var(--radius-card)] border border-border card-surface p-6">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-primary/80">Application Insights</div>
        {funnel.responseRate !== null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3" /> {funnel.responseRate}% moving forward
          </span>
        )}
      </div>

      {funnel.total === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">Apply to a few roles and your funnel shows up here.</p>
         <Link to="/dashboard/jobs" className="text-sm font-medium text-primary hover:underline">
            Browse Jobs →
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-center gap-3">
          {stages.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="w-[70px] shrink-0 text-xs text-muted-foreground">{s.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="w-5 shrink-0 text-right text-xs font-medium">{s.count}</span>
            </div>
          ))}
          {funnel.rejected > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {funnel.rejected} closed as rejected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ApplicationRow = ({ application: a, index }) => {
  const status = STATUS[a.status] || STATUS.applied;
  const stageIdx = PIPELINE_STAGES.indexOf(a.status);
  const isRejected = a.status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ y: -2 }}
    >
      <Link
        to="/applications"
        className="hairline group flex flex-col gap-3 rounded-[var(--radius-card)] card-surface p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:gap-4"
      >
        {a.job?.company?.logo_url ? (
          <img
            src={a.job.company.logo_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 object-contain p-1"
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-cyan text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{a.job?.title || "Job"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {a.job?.company?.name}
            {a.created_at ? ` · ${formatRelativeTime(a.created_at)}` : ""}
          </div>
        </div>

        {/* Mini pipeline — 4 dots showing progression, greyed if rejected */}
        {!isRejected && (
          <div className="hidden items-center gap-1 sm:flex">
            {PIPELINE_STAGES.map((s, i) => (
              <div
                key={s}
                className="h-1.5 w-6 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i <= stageIdx ? STATUS[s].color : "var(--border-strong)",
                }}
              />
            ))}
          </div>
        )}

        <span
          className="shrink-0 self-start rounded-full border px-2.5 py-1 text-[11px] font-medium sm:self-auto"
          style={{ borderColor: `${status.color}40`, backgroundColor: `${status.color}14`, color: status.color }}
        >
          {status.label}
        </span>
      </Link>
    </motion.div>
  );
};

const ResumeCard = ({ profile }) => (
  <div className="hover-lift group relative h-full overflow-hidden rounded-[var(--radius-card)] border border-border card-surface p-6">
    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-80" />
    <div className="relative mb-4 flex items-center gap-2 text-sm font-semibold">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      Resume
    </div>
    {profile?.resume_url ? (
      <>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
        </div>
        <div className="mt-1 truncate text-sm text-muted-foreground">
          {profile.resume_filename || "Your resume"}
        </div>
        {profile.updated_at && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            Last updated {formatRelativeTime(profile.updated_at)}
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <Link
            to="/resume"
            className="hairline inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-3.5 py-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            Replace Resume
          </Link>
        </div>
      </>
    ) : (
      <>
        <p className="text-sm text-muted-foreground">Upload your resume to apply faster.</p>
        <Link
          to="/resume"
          className="group/btn mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
        >
          <UploadCloud className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-translate-y-0.5" /> Upload Resume
        </Link>
      </>
    )}
  </div>
);

const ProfileCompletionCard = ({ profile, completion }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completion / 100) * circumference;

  const signals = [
    { label: "Skills added", done: profile?.skills?.length > 0, icon: Sparkles },
    { label: "Location set", done: !!profile?.location, icon: MapPin },
    { label: "Phone added", done: !!profile?.phone, icon: Phone },
    { label: "Education added", done: !!profile?.education, icon: GraduationCap },
  ];

  return (
    <div className="hover-lift flex h-full flex-col rounded-[var(--radius-card)] border border-border card-surface p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        Career Profile
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center">
          <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="url(#profileGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
            <defs>
              <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent-cyan)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute font-display text-xl">{completion}%</span>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
          {signals.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <s.icon className={`h-3 w-3 shrink-0 ${s.done ? "text-primary" : "text-muted-foreground/50"}`} />
              <span className={s.done ? "text-foreground" : "text-muted-foreground/60"}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/profile"
        className="hairline mt-5 inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-btn)] px-3.5 py-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        {completion === 100 ? "View Profile" : "Complete Profile"}
      </Link>
    </div>
  );
};

// Compact shortlist — replaces the old full JobCard grid for saved jobs.
// The candidate already has a dedicated /saved page for the full card
// experience; here it's just a scannable list so this row of the
// dashboard doesn't repeat that page's job cards.
const ShortlistCard = ({ savedJobs, loading }) => (
  <div className="hover-lift flex h-full flex-col rounded-[var(--radius-card)] border border-border card-surface p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bookmark className="h-4 w-4" />
        </div>
        Shortlist
      </div>
      {savedJobs?.length > 0 && (
        <Link
          to="/saved"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>

    <div className="mt-3 flex flex-1 flex-col">
      {loading !== false ? (
        <BarLoader width={"100%"} color="var(--primary)" />
      ) : savedJobs?.length ? (
        <div className="flex flex-col divide-y divide-border/60">
          {savedJobs.slice(0, 4).map((s) => (
            <Link
              key={s.id}
              to={`/dashboard/jobs?job=${s.job?.id}`}
              className="group flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
            >
              {s.job?.company?.logo_url ? (
                <img
                  src={s.job.company.logo_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md bg-surface-2 object-contain p-1"
                />
              ) : (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium group-hover:text-primary">{s.job?.title || "Job"}</div>
                <div className="truncate text-xs text-muted-foreground">{s.job?.company?.name}</div>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
          <p className="text-sm text-muted-foreground">No saved jobs yet.</p>
          <Link to="/dashboard/jobs" className="text-sm font-medium text-primary hover:underline">
            Browse Jobs →
          </Link>
        </div>
      )}
    </div>
  </div>
);

const EmptyState = ({ text, cta }) => (
  <div className="hairline flex flex-col items-center gap-3 rounded-[var(--radius-card)] card-surface p-10 text-center">
    <p className="text-sm text-muted-foreground">{text}</p>
    {cta && (
      <Link to={cta.to} className="text-sm font-medium text-primary hover:underline">
        {cta.label} →
      </Link>
    )}
  </div>
);

export default DashboardPage;
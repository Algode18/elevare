import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession, useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import {
  Boxes,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Flame,
  School,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import useFetch from "@/hooks/use-fetch";
import { getMyJobs } from "@/api/apiJobs";
import { updateApplicationStatus } from "@/api/apiApplications";
import { cn } from "@/lib/utils";
import BackButton from "@/components/back-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Company-wide hiring dashboard — every applicant across every job this
// recruiter has posted, grouped by job. This page is for triage: scanning,
// filtering, bulk-acting, and quick status bumps. It intentionally does NOT
// re-implement the full candidate workspace (skills/timeline/notes/hire/
// reject) — clicking a candidate deep-links into their job's Applicants
// page (/employer/jobs/:jobId/applicants?applicant=:id) with that candidate
// pre-selected, so there's exactly one place that owns the real hiring
// actions.

const STATUS_BADGE = {
  applied: { label: "Applied", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  reviewed: { label: "Reviewed", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30" },
  interviewing: { label: "Interview", className: "bg-violet-500/10 text-violet-500 border-violet-500/30" },
  offer: { label: "Offer", className: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  hired: { label: "Hired", className: "bg-lime/10 text-lime border-lime/30" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const EXPERIENCE_RANGES = [
  { value: "0-1", label: "0–1 years", test: (n) => n >= 0 && n <= 1 },
  { value: "2-4", label: "2–4 years", test: (n) => n >= 2 && n <= 4 },
  { value: "5+", label: "5+ years", test: (n) => n >= 5 },
];

// Same order as the dashboard's Hiring Pipeline funnel. Used to resolve the
// `stage` query param below into "this status or anything further along" —
// matching the cumulative counts shown in that funnel — as opposed to the
// `status` param (used by the KPI cards), which is an exact match.
const STAGE_ORDER = ["applied", "reviewed", "interviewing", "offer", "hired"];
const STAGE_LABEL = {
  applied: "Applied",
  reviewed: "Reviewed",
  interviewing: "Interview",
  offer: "Offer",
  hired: "Hired",
};

const TRENDING_WINDOW_DAYS = 3;
const TRENDING_MIN_APPLICATIONS = 3;
const NEW_JOB_WINDOW_DAYS = 7;

const daysSince = (dateStr) => {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

// Client-side CSV export — no backend endpoint exists for this, so it's
// built entirely from data already in memory.
const exportApplicationsCsv = (applications) => {
  const header = ["Name", "Job", "Status", "Experience (yrs)", "Education", "Skills", "Applied On"];
  const rows = applications.map((a) => [
    a.name || "",
    a.job?.title || "",
    a.status || "",
    a.experience ?? "",
    a.education || "",
    (a.skills || "").replace(/,/g, ";"),
    a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------

const EmployerApplicationsPage = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const { data: jobs, loading, fn } = useFetch(getMyJobs, { recruiter_id: user?.id });

  useEffect(() => {
    if (isLoaded && user) fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // Dashboard KPI cards link here as /employer/applications?status=interviewing
  // (an exact-match filter). The Hiring Pipeline funnel links here as
  // ?stage=interviewing instead, because the funnel's counts are cumulative
  // ("at this stage or further along") — so its filter has to match the same
  // way, or the number you saw wouldn't match what you land on.
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status");
  const initialStage = searchParams.get("stage");
  const initialJob = searchParams.get("job");

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState(initialJob || "all");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  // Cumulative funnel filter, independent of the exact-match status dropdown.
  // Cleared as soon as the person touches the status dropdown themselves.
  const [stageFilter, setStageFilter] = useState(
    initialStage && STAGE_ORDER.includes(initialStage) ? initialStage : null
  );
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [collapsedJobs, setCollapsedJobs] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  const handleStatusFilterChange = (value) => {
    setStageFilter(null);
    setStatusFilter(value);
  };

  const allApplications = useMemo(() => {
    return (jobs || []).flatMap((job) => (job.applications || []).map((app) => ({ ...app, job })));
  }, [jobs]);

  // ---- Overview metrics ----------------------------------------------------
  const overview = useMemo(() => {
    const counts = { interviewing: 0, offer: 0, hired: 0, rejected: 0 };
    allApplications.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status] += 1;
    });
    const jobsHiring = (jobs || []).filter((j) => j.isOpen).length;

    let mostApplied = null;
    let leastApplied = null;
    (jobs || []).forEach((j) => {
      const count = j.applications?.length || 0;
      if (!mostApplied || count > mostApplied.count) mostApplied = { id: j.id, title: j.title, count };
      if (count > 0 && (!leastApplied || count < leastApplied.count)) {
        leastApplied = { id: j.id, title: j.title, count };
      }
    });

    return {
      total: allApplications.length,
      jobsHiring,
      interviewing: counts.interviewing,
      offers: counts.offer,
      hired: counts.hired,
      rejected: counts.rejected,
      mostApplied,
      leastApplied,
    };
  }, [allApplications, jobs]);

  const recentActivity = useMemo(() => {
    return [...allApplications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  }, [allApplications]);

  // ---- Smart badges per job (computed from real data only) -----------------
  const jobBadges = useMemo(() => {
    const map = {};
    (jobs || []).forEach((j) => {
      const apps = j.applications || [];
      const badges = [];
      if (apps.length === 0) {
        badges.push({ key: "none", label: "No Applicants", icon: "⚠" });
      } else {
        const recentCount = apps.filter((a) => daysSince(a.created_at) <= TRENDING_WINDOW_DAYS).length;
        if (recentCount >= TRENDING_MIN_APPLICATIONS) {
          badges.push({ key: "trending", label: "Trending", icon: "🔥" });
        }
        if (overview.mostApplied && overview.mostApplied.id === j.id && (jobs?.length || 0) > 1) {
          badges.push({ key: "top", label: "Top Performing", icon: "⭐" });
        }
      }
      if (daysSince(j.created_at) <= NEW_JOB_WINDOW_DAYS) {
        badges.push({ key: "new", label: "New Job", icon: "🆕" });
      }
      map[j.id] = badges;
    });
    return map;
  }, [jobs, overview.mostApplied]);

  // ---- Filtering + sorting ---------------------------------------------------
  const matchesFilters = (a) => {
    if (jobFilter !== "all" && String(a.job_id) !== jobFilter) return false;
    if (stageFilter) {
      const idx = STAGE_ORDER.indexOf(stageFilter);
      if (STAGE_ORDER.indexOf(a.status) < idx) return false;
    } else if (statusFilter !== "all" && a.status !== statusFilter) {
      return false;
    }
    if (experienceFilter !== "all") {
      const range = EXPERIENCE_RANGES.find((r) => r.value === experienceFilter);
      if (range && !range.test(Number(a.experience) || 0)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${a.name || ""} ${a.skills || ""} ${a.education || ""} ${a.job?.title || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const sortApps = (list) => {
    const copy = [...list];
    if (sort === "oldest") return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sort === "experience") return copy.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest
  };

  const groups = useMemo(() => {
    return (jobs || [])
      .map((job) => {
        const applications = sortApps((job.applications || []).filter(matchesFilters));
        return { job, applications, totalCount: job.applications?.length || 0 };
      })
      .filter((g) => {
        // Always show a job with zero applicants (so its empty state can
        // surface), unless a job filter is actively excluding it.
        if (jobFilter !== "all" && String(g.job.id) !== jobFilter) return false;
        if (g.totalCount === 0) return true;
        return g.applications.length > 0;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, jobFilter, statusFilter, stageFilter, experienceFilter, search, sort]);

  const toggleCollapsedJob = (jobId) => setCollapsedJobs((c) => ({ ...c, [jobId]: !c[jobId] }));

  const toggleSelected = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const clearSelection = () => setSelectedIds([]);

  const selectedApplications = useMemo(
    () => allApplications.filter((a) => selectedIds.includes(a.id)),
    [allApplications, selectedIds]
  );

  const runBulkStatus = async (status) => {
    if (!session || !selectedIds.length) return;
    setBulkRunning(true);
    try {
      const token = await session.getToken({ template: "supabase" });
      for (const a of selectedApplications) {
        await updateApplicationStatus(token, { job_id: a.job_id, id: a.id }, status);
      }
    } finally {
      setBulkRunning(false);
      clearSelection();
      fn();
    }
  };

  const runBulkDownload = () => {
    selectedApplications.forEach((a) => {
      if (!a.resume) return;
      const link = document.createElement("a");
      link.href = a.resume;
      link.target = "_blank";
      link.click();
    });
  };

  const handleStatusChange = async (application, status) => {
    if (!session) return;
    setBulkRunning(true);
    try {
      const token = await session.getToken({ template: "supabase" });
      await updateApplicationStatus(token, { job_id: application.job_id, id: application.id }, status);
      await fn();
    } finally {
      setBulkRunning(false);
    }
  };

  const handlePreview = (application) => {
    if (!application?.resume) return;
    window.open(application.resume, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (application) => {
    if (!application?.resume) return;
    // Forces a save-as where the storage host's response headers allow it;
    // otherwise browsers fall back to opening it in a new tab like Preview.
    const link = document.createElement("a");
    link.href = application.resume;
    link.download = `${application.name || "resume"}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  if (!isLoaded || loading !== false) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  const noJobsAtAll = !jobs?.length;

  return (
    <div>
      <BackButton fallbackTo="/employer/dashboard" label="Back to Dashboard" />
      <div className="mb-6">
        <h1 className="font-display text-3xl">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage applicants across all jobs.</p>
      </div>

      {noJobsAtAll ? (
        <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">No jobs posted yet.</div>
          <Link
            to="/employer/post-job"
            className="mt-1 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Post Job
          </Link>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="hairline mb-5 grid grid-cols-3 gap-3 rounded-xl bg-surface p-4 sm:grid-cols-6">
            <Overview label="Applicants" value={overview.total} />
            <Overview label="Jobs Hiring" value={overview.jobsHiring} />
            <Overview label="Interviewing" value={overview.interviewing} />
            <Overview label="Offers" value={overview.offers} />
            <Overview label="Hired" value={overview.hired} />
            <Overview label="Rejected" value={overview.rejected} />
          </div>

          {/* Recent activity + most/least applied — real "applied" timestamps
              only; there's no per-stage history stored, so this isn't a full
              status-change feed and there's no "Average Time to Hire" since
              hire timestamps aren't stored either. */}
          <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="hairline rounded-xl bg-surface p-4 lg:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent Activity
              </div>
              {recentActivity.length === 0 ? (
                <div className="py-2 text-sm text-muted-foreground">Nothing yet.</div>
              ) : (
                <div className="flex flex-col gap-2.5 sm:gap-1.5">
                  {recentActivity.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span className="sm:truncate">
                        <span className="font-medium">{a.name}</span> applied to{" "}
                        <span className="text-muted-foreground">{a.job?.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two separate cards side-by-side on mobile; stacked in the
                remaining column on large screens. */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="hairline flex flex-col justify-center gap-1 rounded-xl bg-surface p-3.5 text-sm">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Most Applied</div>
                {overview.mostApplied ? (
                  <div className="font-medium">
                    <span className="line-clamp-2">{overview.mostApplied.title}</span>{" "}
                    <span className="text-muted-foreground">({overview.mostApplied.count})</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">—</div>
                )}
              </div>
              <div className="hairline flex flex-col justify-center gap-1 rounded-xl bg-surface p-3.5 text-sm">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Least Applied</div>
                {overview.leastApplied ? (
                  <div className="font-medium">
                    <span className="line-clamp-2">{overview.leastApplied.title}</span>{" "}
                    <span className="text-muted-foreground">({overview.leastApplied.count})</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">—</div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-0 z-20 mb-5 bg-background/95 pb-1 pt-1 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="hairline flex flex-col gap-3 rounded-xl bg-surface p-4">
              {stageFilter && (
                <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
                  <span>
                    Showing {STAGE_LABEL[stageFilter]} and beyond, from the dashboard's Hiring Pipeline
                  </span>
                  <button
                    type="button"
                    onClick={() => setStageFilter(null)}
                    className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search name, skills, college, job..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All jobs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All jobs</SelectItem>
                        {jobs?.map((j) => (
                          <SelectItem key={j.id} value={String(j.id)}>
                            {j.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select value={stageFilter ? "all" : statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Hiring Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All stages</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="interviewing">Interviewing</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Any experience</SelectItem>
                        {EXPERIENCE_RANGES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="experience">Highest Experience</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk action bar lives inside the sticky block so it's never lost while scrolling.
                  Mobile: two equal-width grid rows (3 primary actions, then 2 secondary actions) instead
                  of an uneven wrap. Desktop: each wrapper collapses via `sm:contents` so the buttons fall
                  back into a single flex-wrap row, unchanged from before. */}
              {selectedIds.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex items-center justify-between sm:contents">
                    <span className="text-sm font-medium">{selectedIds.length} selected</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-muted-foreground hover:text-foreground sm:order-last sm:ml-auto"
                    >
                      Clear selection
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:contents">
                    <button
                      type="button"
                      disabled={bulkRunning}
                      onClick={() => runBulkStatus("interviewing")}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 sm:w-auto sm:justify-start"
                    >
                      Move to Interview
                    </button>
                    <button
                      type="button"
                      disabled={bulkRunning}
                      onClick={() => runBulkStatus("hired")}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-lime/15 px-3 py-1.5 text-xs font-medium text-lime hover:bg-lime/25 disabled:opacity-50 sm:w-auto sm:justify-start"
                    >
                      <Check className="h-3.5 w-3.5" /> Hire
                    </button>
                    <button
                      type="button"
                      disabled={bulkRunning}
                      onClick={() => runBulkStatus("rejected")}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 sm:w-auto sm:justify-start"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <button
                      type="button"
                      onClick={runBulkDownload}
                      className="hairline flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:justify-start"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Resumes
                    </button>
                    <button
                      type="button"
                      onClick={() => exportApplicationsCsv(selectedApplications)}
                      className="hairline flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:justify-start"
                    >
                      <FileText className="h-3.5 w-3.5" /> Export CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {bulkRunning && <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />}

          {/* Applicant list, grouped by job */}
          {groups.length === 0 ? (
            <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">No applicants match these filters.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map(({ job, applications, totalCount }) => (
                <JobGroup
                  key={job.id}
                  job={job}
                  applications={applications}
                  totalCount={totalCount}
                  badges={jobBadges[job.id] || []}
                  collapsed={!!collapsedJobs[job.id]}
                  onToggleCollapsed={() => toggleCollapsedJob(job.id)}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelected}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const Overview = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-2/50 px-2 py-2.5 text-center">
    <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="text-sm font-semibold leading-none">{value}</div>
    <div className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const BADGE_ICON = { trending: Flame, top: Sparkles };

const JobBadge = ({ badge }) => {
  const Icon = BADGE_ICON[badge.key];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {Icon ? <Icon className="h-2.5 w-2.5" /> : <span>{badge.icon}</span>} {badge.label}
    </span>
  );
};

const JobGroup = ({
  job,
  applications,
  totalCount,
  badges,
  collapsed,
  onToggleCollapsed,
  selectedIds,
  onToggleSelect,
  onPreview,
  onDownload,
  onStatusChange,
}) => {
  const logo = job.company?.logo_url ? (
    <img src={job.company.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-1" />
  ) : (
    <div className="h-9 w-9 shrink-0 rounded-md bg-gradient-to-br from-primary to-cyan" />
  );

  const posted = job.created_at
    ? `Posted ${daysSince(job.created_at)} day${daysSince(job.created_at) === 1 ? "" : "s"} ago`
    : null;

  const interviewCount = (job.applications || []).filter((a) => a.status === "interviewing").length;
  const offerCount = (job.applications || []).filter((a) => a.status === "offer").length;
  const hiredCount = (job.applications || []).filter((a) => a.status === "hired").length;

  return (
    <div className="hairline rounded-xl bg-surface">
      {/* Mobile: clean stacked header — title row, status/badges, a 4-up
          stats grid (same shape as the compact cards on Manage Jobs), and a
          full-width action button. Kept separate from the desktop row below
          instead of trying to force one layout to reflow at every width. */}
      <div className="flex flex-col gap-2.5 p-3.5 sm:hidden">
        <button type="button" onClick={onToggleCollapsed} className="flex items-center gap-2 text-left">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {logo}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{job.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {job.company?.name} {posted && `• ${posted}`}
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              job.isOpen
                ? "border-lime/30 bg-lime/10 text-lime"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {job.isOpen ? "Open" : "Paused"}
          </span>
          {badges.map((b) => (
            <JobBadge key={b.key} badge={b} />
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface-2/40 p-2">
          <MiniStat label="Applied" value={totalCount} />
          <MiniStat label="Interview" value={interviewCount} />
          <MiniStat label="Offer" value={offerCount} />
          <MiniStat label="Hired" value={hiredCount} />
        </div>

        <Link
          to={`/employer/jobs/${job.id}/applicants`}
          className="hairline flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface-2"
        >
          <Users className="h-3.5 w-3.5" /> Manage Applicants
        </Link>
      </div>

      {/* Desktop: single row, button on the right */}
      <div className="hidden flex-wrap items-start justify-between gap-3 p-3.5 sm:flex">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          {collapsed ? (
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {logo}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold">{job.title}</span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  job.isOpen
                    ? "border-lime/30 bg-lime/10 text-lime"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {job.isOpen ? "Open" : "Paused"}
              </span>
              {badges.map((b) => (
                <JobBadge key={b.key} badge={b} />
              ))}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {job.company?.name} {posted && `• ${posted}`}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Applicants: <span className="font-medium text-foreground">{totalCount}</span>
              </span>
              <span>
                Interview: <span className="font-medium text-foreground">{interviewCount}</span>
              </span>
              <span>
                Offer: <span className="font-medium text-foreground">{offerCount}</span>
              </span>
              <span>
                Hired: <span className="font-medium text-foreground">{hiredCount}</span>
              </span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to={`/employer/jobs/${job.id}/applicants`}
            className="hairline flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2"
          >
            <Users className="h-3.5 w-3.5" /> Manage Applicants
          </Link>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-2 border-t border-border/60 p-3">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="text-sm text-muted-foreground">Waiting for candidates...</div>
              <p className="max-w-xs text-xs text-muted-foreground">
                Share this job from{" "}
                <Link to="/employer/jobs" className="text-primary hover:underline">
                  Manage Jobs
                </Link>{" "}
                to start getting applicants.
              </p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No applicants in this job match the current filters.
            </div>
          ) : (
            applications.map((application) => (
              <ApplicantRow
                key={application.id}
                application={application}
                selected={selectedIds.includes(application.id)}
                onToggleSelect={() => onToggleSelect(application.id)}
                onPreview={() => onPreview(application)}
                onDownload={() => onDownload(application)}
                onStatusChange={(status) => onStatusChange(application, status)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ApplicantRow = ({
  application,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onStatusChange,
}) => {
  const badge = STATUS_BADGE[application.status] || STATUS_BADGE.applied;

  return (
    <div className="hairline flex flex-col gap-2 rounded-lg bg-surface-2/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "Deselect applicant" : "Select applicant"}
          className={cn(
            "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
            selected ? "border-primary bg-primary" : "border-border bg-background hover:border-border-strong"
          )}
        >
          {selected && <div className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
        </button>

        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-xs font-semibold text-primary-foreground">
          {(application.name || "?").charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/employer/jobs/${application.job_id}/applicants?applicant=${application.id}`}
              className="truncate text-sm font-medium hover:text-primary hover:underline"
            >
              {application.name}
            </Link>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>Applied {timeAgo(application.created_at)}</span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {application.experience ?? "—"} yrs
            </span>
            <span className="flex items-center gap-1">
              <School className="h-3 w-3" /> {application.education || "—"}
            </span>
          </div>

          {application.skills && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Boxes className="h-3 w-3 shrink-0 text-muted-foreground" />
              {application.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((skill) => (
                  <span
                    key={skill}
                    className="hairline rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick triage actions only — status bump, resume peek/download.
          Full hiring actions (notes, hire, reject, timeline) live in one
          place: the job's Applicants workspace, linked via the name above. */}
      <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:shrink-0 sm:justify-start">
        <Select value={application.status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onPreview}
            disabled={!application.resume}
            title="Preview resume"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!application.resume}
            title="Download resume"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <Link
            to={`/employer/jobs/${application.job_id}/applicants?applicant=${application.id}`}
            title="View profile"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployerApplicationsPage;
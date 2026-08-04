import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useUser, useSession } from "@clerk/react";
import { BarLoader } from "react-spinners";
import {
  Briefcase,
  LayoutGrid,
  List,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { getMyJobs, UpdateHiringStatus, deleteJob } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ManageJobCard, { LIST_GRID_TEMPLATE } from "@/components/manage-job-card";
import BackButton from "@/components/back-button";

// ---- Config ---------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently Updated" },
  { value: "most_applicants", label: "Most Applicants" },
  { value: "least_applicants", label: "Least Applicants" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "alphabetical", label: "Alphabetical" },
];

const STALE_DAYS = 14; // no applicants for this long -> needs attention
const NEEDS_ATTENTION_INTERVIEW_DAYS = 5; // interview pending this long -> needs attention

const daysSince = (dateStr) => {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

// Derives status + hiring metrics + "needs attention" reasons for a job.
// Pure function so it's easy to reuse in sorting/filtering.
function deriveJobInsights(job) {
  const applications = job.applications || [];

  const metrics = {
    applicants: applications.length,
    interviews: applications.filter((a) => a.status === "interviewing").length,
    offers: applications.filter((a) => a.status === "offer").length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  const lastApplicationAt = applications.reduce((latest, a) => {
    if (!a.created_at) return latest;
    return !latest || new Date(a.created_at) > new Date(latest) ? a.created_at : latest;
  }, null);

  const isExpired = job.expires_at ? new Date(job.expires_at).getTime() < Date.now() : false;

  let status = "open";
  if (!job.isOpen) status = "closed";
  else if (isExpired) status = "expired";

  const reasons = [];
  if (status === "open") {
    const noApplicantsDays = daysSince(job.created_at);
    if (metrics.applicants === 0 && noApplicantsDays >= STALE_DAYS) {
      reasons.push(`No applicants for ${noApplicantsDays} days`);
    } else if (metrics.applicants > 0) {
      const sinceLast = daysSince(lastApplicationAt);
      if (sinceLast >= STALE_DAYS) {
        reasons.push(`No applications for ${sinceLast} days`);
      }
    }
    if (
      metrics.interviews > 0 &&
      daysSince(lastApplicationAt) >= NEEDS_ATTENTION_INTERVIEW_DAYS
    ) {
      reasons.push("Interview pending — no recent movement");
    }
    if (metrics.offers > metrics.hired && daysSince(lastApplicationAt) >= 3) {
      reasons.push("Offer awaiting response");
    }
  }
  if (status === "expired") {
    reasons.push("Job listing has expired");
  }

  return {
    status,
    metrics,
    lastApplicationAt,
    needsAttention: reasons.length > 0,
    attentionReasons: reasons,
  };
}

// ---------------------------------------------------------------------------

const EmployerJobsPage = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();

  const {
    loading: loadingJobs,
    data: jobs,
    fn: fnJobs,
  } = useFetch(getMyJobs, { recruiter_id: user?.id });

  useEffect(() => {
    if (isLoaded && user?.id) fnJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [selectedIds, setSelectedIds] = useState([]);
  const [collapsed, setCollapsed] = useState({ closed: true, archived: true });

  const enriched = useMemo(
    () => (jobs || []).map((job) => ({ job, ...deriveJobInsights(job) })),
    [jobs]
  );

  const companyOptions = useMemo(() => {
    const seen = new Map();
    enriched.forEach(({ job }) => {
      if (job.company?.name) seen.set(job.company_id, job.company.name);
    });
    return Array.from(seen.entries());
  }, [enriched]);

  const locationOptions = useMemo(
    () => Array.from(new Set(enriched.map(({ job }) => job.location).filter(Boolean))),
    [enriched]
  );

  const typeOptions = useMemo(
    () => Array.from(new Set(enriched.map(({ job }) => job.job_type).filter(Boolean))),
    [enriched]
  );

  const filtered = useMemo(() => {
    return enriched.filter(({ job, status }) => {
      if (search && !job.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (companyFilter !== "all" && String(job.company_id) !== companyFilter) return false;
      if (locationFilter !== "all" && job.location !== locationFilter) return false;
      if (typeFilter !== "all" && job.job_type !== typeFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter, companyFilter, locationFilter, typeFilter]);

  const sorter = (a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.job.created_at) - new Date(b.job.created_at);
      case "updated":
        return (
          new Date(b.lastApplicationAt || b.job.created_at) -
          new Date(a.lastApplicationAt || a.job.created_at)
        );
      case "most_applicants":
        return b.metrics.applicants - a.metrics.applicants;
      case "least_applicants":
        return a.metrics.applicants - b.metrics.applicants;
      case "needs_attention":
        return Number(b.needsAttention) - Number(a.needsAttention);
      case "alphabetical":
        return (a.job.title || "").localeCompare(b.job.title || "");
      case "newest":
      default:
        return new Date(b.job.created_at) - new Date(a.job.created_at);
    }
  };

  const RECENTLY_ACTIVE_DAYS = 3;

  const needsAttention = filtered.filter((e) => e.needsAttention).sort(sorter);
  const recentlyActive = filtered
    .filter(
      (e) =>
        e.status === "open" &&
        !e.needsAttention &&
        e.lastApplicationAt &&
        daysSince(e.lastApplicationAt) <= RECENTLY_ACTIVE_DAYS
    )
    .sort(sorter);
  const openJobs = filtered
    .filter(
      (e) =>
        e.status === "open" &&
        !e.needsAttention &&
        !recentlyActive.includes(e)
    )
    .sort(sorter);
  const closedJobs = filtered.filter((e) => e.status === "closed").sort(sorter);
  const archivedJobs = filtered.filter((e) => e.status === "expired").sort(sorter);

  const toggleSelected = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const clearSelection = () => setSelectedIds([]);

  const [bulkRunning, setBulkRunning] = useState(false);

  const runBulk = async (action) => {
    if (!session) return;
    setBulkRunning(true);
    try {
      const token = await session.getToken({ template: "supabase" });
      const targets = filtered.filter((e) => selectedIds.includes(e.job.id));
      for (const { job } of targets) {
        if (action === "close") await UpdateHiringStatus(token, { job_id: job.id }, false);
        if (action === "reopen") await UpdateHiringStatus(token, { job_id: job.id }, true);
        if (action === "delete") await deleteJob(token, { job_id: job.id });
      }
    } finally {
      setBulkRunning(false);
      clearSelection();
      fnJobs();
    }
  };

  const toggleCollapsed = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  if (!isLoaded || loadingJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  const noJobsAtAll = !jobs?.length;

  return (
    <div>
      <BackButton fallbackTo="/employer/dashboard" label="Back to Dashboard" />
      <div className="mb-6 flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl">Manage Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track hiring performance across every role you've posted.
          </p>
        </div>
        <Link
          to="/employer/post-job"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Post a job
        </Link>
      </div>

      {noJobsAtAll ? (
        <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">No jobs posted yet.</div>
          <p className="text-sm text-muted-foreground">
            Create your first job posting to start hiring.
          </p>
          <Link
            to="/employer/post-job"
            className="mt-1 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Post Job
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar: search, filters, sort, view toggle */}
          <div className="hairline mb-6 flex flex-col gap-3 rounded-xl bg-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search jobs by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {companyOptions.length > 1 && (
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All companies</SelectItem>
                        {companyOptions.map(([id, name]) => (
                          <SelectItem key={id} value={String(id)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}

                {locationOptions.length > 1 && (
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All locations</SelectItem>
                        {locationOptions.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}

                {typeOptions.length > 1 && (
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All types</SelectItem>
                        {typeOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden items-center justify-end gap-1 rounded-md border border-border p-0.5 md:flex md:ml-auto">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded",
                    view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded",
                    view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bulk actions bar — appears once something is selected */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 rounded-md bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium">{selectedIds.length} selected</span>
                <button
                  disabled={bulkRunning}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={() => runBulk("close")}
                >
                  Close
                </button>
                <button
                  disabled={bulkRunning}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={() => runBulk("reopen")}
                >
                  Reopen
                </button>
                <button
                  disabled={bulkRunning}
                  className="text-destructive hover:opacity-80 disabled:opacity-50"
                  onClick={() => runBulk("delete")}
                >
                  Delete
                </button>
                {bulkRunning && <span className="text-xs text-muted-foreground">Working…</span>}
                <button
                  disabled={bulkRunning}
                  className="ml-auto text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={clearSelection}
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="hairline rounded-xl bg-surface p-10 text-center text-sm text-muted-foreground">
              No jobs match your filters.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {view === "list" && <ListHeader />}
              {needsAttention.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-warning">
                    <AlertTriangle className="h-4 w-4" /> Needs Attention ({needsAttention.length})
                  </div>
                  <JobGrid
                    entries={needsAttention}
                    view={view}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onDeleted={fnJobs}
                    onRefresh={fnJobs}
                  />
                </section>
              )}

              {recentlyActive.length > 0 && (
                <section>
                  <div className="mb-3 text-sm font-semibold">
                    Recently Active ({recentlyActive.length})
                  </div>
                  <JobGrid
                    entries={recentlyActive}
                    view={view}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onDeleted={fnJobs}
                    onRefresh={fnJobs}
                  />
                </section>
              )}

              <section>
                <div className="mb-3 text-sm font-semibold">Open Jobs ({openJobs.length})</div>
                {openJobs.length > 0 ? (
                  <JobGrid
                    entries={openJobs}
                    view={view}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onDeleted={fnJobs}
                    onRefresh={fnJobs}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No open jobs match your filters.</p>
                )}
              </section>

              {closedJobs.length > 0 && (
                <CollapsibleSection
                  title={`Closed Jobs (${closedJobs.length})`}
                  collapsed={collapsed.closed}
                  onToggle={() => toggleCollapsed("closed")}
                >
                  <JobGrid
                    entries={closedJobs}
                    view={view}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onDeleted={fnJobs}
                    onRefresh={fnJobs}
                  />
                </CollapsibleSection>
              )}

              {archivedJobs.length > 0 && (
                <CollapsibleSection
                  title={`Archived Jobs (${archivedJobs.length})`}
                  collapsed={collapsed.archived}
                  onToggle={() => toggleCollapsed("archived")}
                >
                  <JobGrid
                    entries={archivedJobs}
                    view={view}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onDeleted={fnJobs}
                    onRefresh={fnJobs}
                  />
                </CollapsibleSection>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CollapsibleSection = ({ title, collapsed, onToggle, children }) => (
  <section>
    <button
      type="button"
      onClick={onToggle}
      className="mb-3 flex w-full items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      {title}
    </button>
    {!collapsed && children}
  </section>
);

const ListHeader = () => (
  <div className="hidden md:-mx-1 md:block md:overflow-x-auto md:px-1">
    <div
      className="grid min-w-[880px] items-center gap-5 px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      style={{ gridTemplateColumns: LIST_GRID_TEMPLATE }}
    >
      <span>Job</span>
      <span>Hiring Metrics</span>
      <span>Activity</span>
      <span>Tags</span>
      <span className="text-right">Actions</span>
    </div>
  </div>
);

const JobGrid = ({ entries, view, selectedIds, onToggleSelect, onDeleted, onRefresh }) => {
  if (view === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ job, status, metrics, lastApplicationAt, attentionReasons }) => (
          <ManageJobCard
            key={job.id}
            job={job}
            status={status}
            metrics={metrics}
            lastApplicationAt={lastApplicationAt}
            attentionReasons={attentionReasons}
            view={view}
            selected={selectedIds.includes(job.id)}
            onToggleSelect={() => onToggleSelect(job.id)}
            onDeleted={onDeleted}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="md:-mx-1 md:overflow-x-auto md:px-1">
      <div className="flex flex-col gap-3 md:min-w-[880px] md:gap-3">
        {entries.map(({ job, status, metrics, lastApplicationAt, attentionReasons }) => (
          <ManageJobCard
            key={job.id}
            job={job}
            status={status}
            metrics={metrics}
            lastApplicationAt={lastApplicationAt}
            attentionReasons={attentionReasons}
            view={view}
            selected={selectedIds.includes(job.id)}
            onToggleSelect={() => onToggleSelect(job.id)}
            onDeleted={onDeleted}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployerJobsPage;
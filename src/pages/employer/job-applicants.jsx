import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession, useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import {
  BadgeCheck,
  Boxes,
  Briefcase,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Pause,
  Pencil,
  Play,
  School,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

import useFetch from "@/hooks/use-fetch";
import { getSingleJob, UpdateHiringStatus } from "@/api/apiJobs";
import { updateApplicationStatus } from "@/api/apiApplications";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/elevare-primitives";
import PipelineProgress from "@/components/pipeline-progress";
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

// Funnel order used for the pipeline bars + KPI strip + "move to next stage".
// `rejected` is a terminal branch off the main line (see pipeline-progress.jsx)
// so it isn't part of the linear funnel, just its own count/chip.
const STAGES = [
  { key: "applied", label: "Applied" },
  { key: "reviewed", label: "Reviewed" },
  { key: "interviewing", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

const STATUS_CHIP_TONE = {
  applied: "default",
  reviewed: "cyan",
  interviewing: "cyan",
  offer: "warn",
  hired: "lime",
  rejected: "danger",
};

const STATUS_LABEL = {
  applied: "Applied",
  reviewed: "Reviewed",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

// ---------------------------------------------------------------------------

const EmployerJobApplicantsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  // Applications page links here as
  // /employer/jobs/:jobId/applicants?applicant=:id to pre-select a specific
  // candidate instead of duplicating the candidate detail UI on that page.
  const [searchParams] = useSearchParams();
  const deepLinkedApplicantId = searchParams.get("applicant");
  const appliedDeepLink = useRef(false);

  const {
    data: job,
    loading: loadingJob,
    fn: fnJob,
  } = useFetch(getSingleJob, { job_id: jobId });

  const { fn: fnToggleOpen } = useFetch(UpdateHiringStatus, { job_id: jobId });

  useEffect(() => {
    if (isLoaded && jobId) fnJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, jobId]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedId, setSelectedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [copied, setCopied] = useState(false);
  // Session-only scratchpad, keyed by application id. There is no `notes`
  // column on `applications`, and this task is UI-only (no schema changes),
  // so notes intentionally do NOT persist across a refresh. If persistent
  // notes are wanted later, that needs a real `notes` column + API call.
  const [draftNotes, setDraftNotes] = useState({});

  const applications = useMemo(() => job?.applications || [], [job]);

  // Guard: don't let a recruiter land on someone else's job workspace.
  const isOwner = !job || !user || job.recruiter_id === user.id;

  const metrics = useMemo(() => {
    const counts = { applied: 0, reviewed: 0, interviewing: 0, offer: 0, hired: 0, rejected: 0 };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status] += 1;
    });
    return counts;
  }, [applications]);

  const maxStageCount = Math.max(1, ...STAGES.map((s) => metrics[s.key]));

  const filteredSorted = useMemo(() => {
    let list = applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${a.name || ""} ${a.skills || ""} ${a.education || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });
    return list;
  }, [applications, statusFilter, search, sort]);

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) || null,
    [applications, selectedId]
  );

  // Keep a selection alive whenever the filtered list changes shape.
  useEffect(() => {
    if (!filteredSorted.length) {
      setSelectedId(null);
      return;
    }
    // Honor a candidate deep-linked from Applications, but only once —
    // after that, normal selection behavior takes over so the user can
    // click around freely without snapping back.
    if (!appliedDeepLink.current && deepLinkedApplicantId) {
      const linked = filteredSorted.find((a) => String(a.id) === String(deepLinkedApplicantId));
      if (linked) {
        appliedDeepLink.current = true;
        setSelectedId(linked.id);
        return;
      }
    }
    if (!filteredSorted.some((a) => a.id === selectedId)) {
      setSelectedId(filteredSorted[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSorted]);

  const handleStatusChange = async (application, status) => {
    if (!session) return;
    setUpdatingId(application.id);
    try {
      const token = await session.getToken({ template: "supabase" });
      await updateApplicationStatus(token, { job_id: application.job_id, id: application.id }, status);
      await fnJob();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePause = async () => {
    await fnToggleOpen(!job.isOpen);
    await fnJob();
  };

  const handleDownload = (application) => {
    if (!application?.resume) return;
    const link = document.createElement("a");
    link.href = application.resume;
    link.target = "_blank";
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, nothing else to do.
    }
  };

  const nextStage = (status) => {
    const idx = STAGES.findIndex((s) => s.key === status);
    if (idx === -1 || idx === STAGES.length - 1) return null;
    return STAGES[idx + 1].key;
  };

  if (!isLoaded || loadingJob !== false) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  if (!job) {
    return (
      <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
        <div className="text-sm font-medium">Job not found.</div>
        <BackButton fallbackTo="/employer/jobs" label="Back to Manage Jobs" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
        <div className="text-sm font-medium">You don't have access to this job's applicants.</div>
        <BackButton fallbackTo="/employer/jobs" label="Back to Manage Jobs" />
      </div>
    );
  }

  const posted = timeAgo(job.created_at);

  return (
    <div>
      {/* Breadcrumb */}
      <BackButton fallbackTo="/employer/jobs" label="Manage Jobs" />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl">{job.title}</h1>
            <Chip tone={job.isOpen ? "lime" : "danger"}>{job.isOpen ? "Open" : "Closed"}</Chip>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {job.company?.name}
              {job.company?.verification_status === "verified" && (
                <BadgeCheck className="h-3.5 w-3.5 text-cyan" aria-label="Verified company" />
              )}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {applications.length} applicant
              {applications.length === 1 ? "" : "s"}
            </span>
            {posted && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span>Posted {posted}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage candidates applying for this role.</p>
        </div>

       <div className="grid w-full grid-cols-4 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
  <Link
    to={`/employer/post-job?edit=${job.id}`}
    state={{ from: { path: `/employer/jobs/${job.id}/applicants`, label: "Applicants" } }}
    className="hairline flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:px-3 sm:text-xs"
  >
    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Edit
  </Link>
  <Link
    to={`/jobs/${job.id}?preview=1`}
    state={{ from: { path: `/employer/jobs/${job.id}/applicants`, label: "Applicants" } }}
    className="hairline flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:px-3 sm:text-xs"
  >
    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Preview
  </Link>
  <button
    type="button"
    onClick={handleCopyLink}
    className="hairline flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:px-3 sm:text-xs"
  >
    <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {copied ? "Copied!" : "Share"}
  </button>
  <button
    type="button"
    onClick={handleTogglePause}
    className="hairline flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 sm:w-auto sm:px-3 sm:text-xs"
  >
    {job.isOpen ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
    {job.isOpen ? "Pause" : "Reopen"}
  </button>
</div>
      </div>

      {/* KPI strip */}
      <div className="hairline mb-5 grid grid-cols-3 gap-3 rounded-xl bg-surface p-4 sm:grid-cols-6">
        <Kpi label="Applicants" value={applications.length} />
        <Kpi label="Reviewed" value={metrics.reviewed} />
        <Kpi label="Interview" value={metrics.interviewing} />
        <Kpi label="Offer" value={metrics.offer} />
        <Kpi label="Hired" value={metrics.hired} />
        <Kpi label="Rejected" value={metrics.rejected} />
      </div>

      {/* Pipeline bars */}
      <div className="hairline mb-6 rounded-xl bg-surface p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hiring Pipeline
        </div>
        <div className="flex flex-col gap-2">
          {STAGES.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{s.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(metrics[s.key] / maxStageCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-foreground">
                {metrics[s.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState job={job} onCopyLink={handleCopyLink} copied={copied} />
      ) : (
        <>
          {/* Search & filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
  <div className="relative min-w-[220px] flex-1">
    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input
      className="pl-8"
      placeholder="Search applicants..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>
  <div className="flex gap-2">
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="applied">Applied</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="interviewing">Interviewing</SelectItem>
          <SelectItem value="offer">Offer</SelectItem>
          <SelectItem value="hired">Hired</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="name">Name (A–Z)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</div>

          {filteredSorted.length === 0 ? (
            <div className="hairline flex flex-col items-center gap-2 rounded-2xl bg-surface p-12 text-center">
              <div className="text-sm text-muted-foreground">No applicants match these filters.</div>
            </div>
          ) : (
            // Master-detail layout
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-start">
              {/* Applicant list */}
              <div className="hairline flex flex-col gap-1 rounded-xl bg-surface p-2 lg:max-h-[70vh] lg:overflow-y-auto">
                {filteredSorted.map((application) => (
                  <ApplicantRow
                    key={application.id}
                    application={application}
                    active={application.id === selectedId}
                    onClick={() => setSelectedId(application.id)}
                  />
                ))}
              </div>

              {/* Candidate details */}
              <div className="lg:sticky lg:top-4">
                {selected ? (
                  <CandidateDetailPanel
                    application={selected}
                    updating={updatingId === selected.id}
                    onStatusChange={(status) => handleStatusChange(selected, status)}
                    onDownload={() => handleDownload(selected)}
                    note={draftNotes[selected.id] || ""}
                    onNoteChange={(text) =>
                      setDraftNotes((prev) => ({ ...prev, [selected.id]: text }))
                    }
                    nextStage={nextStage(selected.status)}
                  />
                ) : (
                  <div className="hairline rounded-xl bg-surface p-12 text-center text-sm text-muted-foreground">
                    Select an applicant to view details.
                  </div>
                )}
              </div>
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

const Kpi = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-2/50 px-2 py-2.5 text-center">
    <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const ApplicantRow = ({ application, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
      active ? "bg-primary/10" : "hover:bg-surface-2"
    )}
  >
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-xs font-semibold text-primary-foreground">
      {(application.name || "?").charAt(0).toUpperCase()}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{application.name}</span>
        <Chip tone={STATUS_CHIP_TONE[application.status] || "default"}>
          {STATUS_LABEL[application.status] || application.status}
        </Chip>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {application.experience ?? "—"} yrs • {application.skills || "No skills listed"}
      </div>
    </div>
  </button>
);

const CandidateDetailPanel = ({
  application,
  updating,
  onStatusChange,
  onDownload,
  note,
  onNoteChange,
  nextStage,
}) => (
  <div className="hairline flex flex-col gap-5 rounded-xl bg-surface p-5">
    {updating && <BarLoader width={"100%"} color="var(--primary)" />}

    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold">{application.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {application.experience ?? "—"} yrs experience
          </span>
          <span className="flex items-center gap-1">
            <School className="h-3.5 w-3.5" /> {application.education || "—"}
          </span>
        </div>
      </div>
      <Select value={application.status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40 shrink-0">
          <SelectValue placeholder="Status" />
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
    </div>

    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Boxes className="h-3.5 w-3.5" /> Skills
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(application.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        {!application.skills && <span className="text-sm text-muted-foreground">No skills listed.</span>}
      </div>
    </div>

    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</div>
      <PipelineProgress status={application.status} />
      <div className="mt-2 text-xs text-muted-foreground">
        Applied {new Date(application.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    </div>

    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Notes <span className="normal-case text-muted-foreground/70">(private, this session only)</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add a private note about this candidate..."
        rows={3}
        className="hairline w-full resize-none rounded-lg bg-background p-2.5 text-sm outline-none focus:border-primary"
      />
    </div>

    <div className="flex gap-2 border-t border-border/60 pt-4">
  <button
    type="button"
    onClick={onDownload}
    disabled={!application.resume}
    className="hairline flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 disabled:opacity-40"
  >
    <Download className="h-3.5 w-3.5" /> Resume
  </button>
  {nextStage && (
    <button
      type="button"
      onClick={() => onStatusChange(nextStage)}
      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
    >
      <ChevronRight className="h-3.5 w-3.5" /> {STATUS_LABEL[nextStage]}
    </button>
  )}
  {application.status !== "rejected" && (
    <button
      type="button"
      onClick={() => onStatusChange("rejected")}
      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
    >
      <X className="h-3.5 w-3.5" /> Reject
    </button>
  )}
</div>
  </div>
);

const EmptyState = ({ job, onCopyLink, copied }) => (
  <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
      <Send className="h-5 w-5" />
    </div>
    <div className="text-sm font-medium">No applicants yet.</div>
    <p className="max-w-sm text-sm text-muted-foreground">
      Share this job to start getting candidates into your hiring pipeline.
    </p>
    <div className="mt-2 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onCopyLink}
        className="hairline flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2"
      >
        <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy Link"}
      </button>
      <Link
        to={`/jobs/${job.id}?preview=1`}
        state={{ from: { path: `/employer/jobs/${job.id}/applicants`, label: "Applicants" } }}
        className="hairline flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2"
      >
        <Eye className="h-3.5 w-3.5" /> Preview Job
      </Link>
      <Link
        to={`/employer/post-job?edit=${job.id}`}
        state={{ from: { path: `/employer/jobs/${job.id}/applicants`, label: "Applicants" } }}
        className="hairline flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Job
      </Link>
    </div>
  </div>
);

export default EmployerJobApplicantsPage;
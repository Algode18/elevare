import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Pencil,
  Users,
  Pause,
  Play,
  Copy,
  Share2,
  Trash2,
  AlertTriangle,
  CalendarDays,
  UserCheck,
} from "lucide-react";

import useFetch from "@/hooks/use-fetch";
import { addNewJob, deleteJob, UpdateHiringStatus } from "@/api/apiJobs";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  open: { dot: "bg-lime", text: "text-lime", label: "Open" },
  closed: { dot: "bg-destructive", text: "text-destructive", label: "Closed" },
  expired: { dot: "bg-warning", text: "text-warning", label: "Expired" },
};

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Shared column template — the list header in jobs.jsx must use the exact
// same template so labels line up with the cells beneath them.
export const LIST_GRID_TEMPLATE =
  "minmax(240px,2fr) 200px 150px minmax(120px,1fr) 168px";

const IconAction = ({ icon: Icon, label, ...props }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
    {...props}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

const ManageJobCard = ({
  job,
  status,
  metrics,
  lastApplicationAt,
  attentionReasons = [],
  view = "list",
  selected = false,
  onToggleSelect = () => {},
  onDeleted = () => {},
  onRefresh = () => {},
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { loading: loadingToggle, fn: fnToggle } = useFetch(UpdateHiringStatus, {
    job_id: job.id,
  });
  const { loading: loadingDuplicate, fn: fnDuplicate } = useFetch(addNewJob);
  const { loading: loadingDelete, fn: fnDeleteThis } = useFetch(deleteJob, { job_id: job.id });

  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.open;
  const posted = timeAgo(job.created_at);
  const lastApp = timeAgo(lastApplicationAt);
  const isList = view === "list";
  const hasAttention = attentionReasons.length > 0;

  const handleTogglePause = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await fnToggle(!job.isOpen);
    onRefresh();
  };

  const handleDuplicate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    await fnDuplicate(null, {
      title: `${job.title} (Copy)`,
      description: job.description,
      location: job.location,
      company_id: job.company_id,
      requirements: job.requirements,
      skills: job.skills || [],
      job_type: job.job_type,
      work_mode: job.work_mode,
      duration: job.duration,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      salary_period: job.salary_period,
      salary_range: job.salary_range,
      benefits: job.benefits || [],
      hashtags: job.hashtags || [],
      recruiter_id: job.recruiter_id,
      isOpen: true,
    });
    onRefresh();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`Delete "${job.title}"? This can't be undone.`)) return;
    await fnDeleteThis();
    onDeleted();
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const url = `${window.location.origin}/jobs/${job.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url });
        return;
      } catch {
        // User cancelled the native share sheet — fall through to copy.
      }
    }
    handleCopyLink(e);
  };

  const handleCopyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/jobs/${job.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing further to do.
    }
  };

  const busy = loadingToggle || loadingDuplicate || loadingDelete;

  const checkbox = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleSelect();
      }}
      aria-label={selected ? "Deselect job" : "Select job"}
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
        selected ? "border-primary bg-primary" : "border-border bg-background hover:border-border-strong"
      )}
    >
      {selected && <div className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
    </button>
  );

  const logo = job.company?.logo_url ? (
    <img
      src={job.company.logo_url}
      alt=""
      className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-1"
    />
  ) : (
    <div className="h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-primary to-cyan" />
  );

  const jobColumn = (
    <div className="flex min-w-0 items-center gap-3">
      {checkbox}
      {logo}
      <div className="min-w-0">
        <Link
          to={`/jobs/${job.id}?preview=1`}
          state={{ from: { path: "/employer/jobs", label: "Manage Jobs" } }}
          className="block truncate text-sm font-semibold leading-tight hover:text-primary"
          title={job.title}
        >
          {job.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          <span className="truncate text-muted-foreground">{job.company?.name}</span>
          <span className="shrink-0 text-muted-foreground/40">•</span>
          <span className="flex shrink-0 items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
            <span className={cn("font-medium", statusStyle.text)}>{statusStyle.label}</span>
          </span>
          {hasAttention && (
            <span
              className="ml-1 inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning"
              title={attentionReasons.join(" • ")}
            >
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{attentionReasons[0]}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const metricsColumn = (
    <div className="grid grid-cols-4 gap-1">
      <Metric value={metrics.applicants} label="Applied" />
      <Metric value={metrics.interviews} label="Interview" />
      <Metric value={metrics.offers} label="Offer" />
      <Metric value={metrics.hired} label="Hired" />
    </div>
  );

  const activityColumn = (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1 truncate">
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span className="truncate">{posted ? `Posted ${posted}` : "—"}</span>
      </span>
      <span className="flex items-center gap-1 truncate">
        <UserCheck className="h-3 w-3 shrink-0" />
        <span className="truncate">{lastApp ? `Applicant ${lastApp}` : "No applicants"}</span>
      </span>
    </div>
  );

  const allTags = [job.work_mode, job.job_type, ...(job.skills || [])].filter(Boolean);
  const visibleTagCount = isList ? 2 : 4;
  const tagsColumn = (
    <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
      {allTags.slice(0, visibleTagCount).map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
      {allTags.length > visibleTagCount && <Tag>+{allTags.length - visibleTagCount}</Tag>}
    </div>
  );

  const actionsColumn = isList ? (
    <div className="flex shrink-0 items-center justify-end gap-0.5">
      <Link
        to={`/employer/post-job?edit=${job.id}`}
        state={{ from: { path: "/employer/jobs", label: "Manage Jobs" } }}
        title="Edit"
        aria-label="Edit"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <Link
        to={`/employer/jobs/${job.id}/applicants`}
        title="Applicants"
        aria-label="Applicants"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Users className="h-3.5 w-3.5" />
      </Link>
      <IconAction
        icon={job.isOpen ? Pause : Play}
        label={job.isOpen ? "Pause" : "Reopen"}
        onClick={handleTogglePause}
        disabled={busy}
      />
      <div className="relative">
        <IconAction
          icon={MoreHorizontal}
          label="More"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        />
        {menuOpen && (
          <ActionsMenu
            onClose={() => setMenuOpen(false)}
            onShare={handleShare}
            onCopyLink={handleCopyLink}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            copied={copied}
          />
        )}
      </div>
    </div>
  ) : (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        to={`/employer/post-job?edit=${job.id}`}
        state={{ from: { path: "/employer/jobs", label: "Manage Jobs" } }}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Link>
      <Link
        to={`/employer/jobs/${job.id}/applicants`}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <Users className="h-3.5 w-3.5" /> Applicants
      </Link>
      <button
        type="button"
        onClick={handleTogglePause}
        disabled={busy}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
      >
        {job.isOpen ? (
          <>
            <Pause className="h-3.5 w-3.5" /> Pause
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Reopen
          </>
        )}
      </button>
      <div className="relative">
        <IconAction
          icon={MoreHorizontal}
          label="More"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        />
        {menuOpen && (
          <ActionsMenu
            onClose={() => setMenuOpen(false)}
            onShare={handleShare}
            onCopyLink={handleCopyLink}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            copied={copied}
          />
        )}
      </div>
    </div>
  );

  // ---- List view: single-line table row, fixed columns shared with the ----
  // ---- header rendered by jobs.jsx (LIST_GRID_TEMPLATE).               ----
  if (isList) {
    return (
      <div
        className={cn(
          "hairline grid items-center gap-5 rounded-lg bg-surface/60 px-3 py-2.5 transition-opacity hover:bg-surface",
          busy && "opacity-70"
        )}
        style={{ gridTemplateColumns: LIST_GRID_TEMPLATE }}
      >
        {jobColumn}
        {metricsColumn}
        {activityColumn}
        {tagsColumn}
        {actionsColumn}
      </div>
    );
  }

  // ---- Grid view: compact vertical card ----
  return (
    <div
      className={cn(
        "hairline flex flex-col gap-3 rounded-xl bg-surface/60 p-4 transition-opacity",
        busy && "opacity-70"
      )}
    >
      {jobColumn}
      <div className="rounded-lg bg-surface-2/40 p-2">{metricsColumn}</div>
      <div className="flex items-start justify-between gap-3">
        {activityColumn}
        {tagsColumn}
      </div>
      <div className="border-t border-border/60 pt-2.5">{actionsColumn}</div>
    </div>
  );
};

const ActionsMenu = ({ onClose, onShare, onCopyLink, onDuplicate, onDelete, copied }) => (
  <>
    <div className="fixed inset-0 z-10" onClick={onClose} />
    <div className="hairline absolute right-0 top-8 z-20 w-44 rounded-lg bg-surface p-1 shadow-lg">
      <button
        type="button"
        onClick={onShare}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-2"
      >
        <Share2 className="h-3.5 w-3.5" /> Share Job
      </button>
      <button
        type="button"
        onClick={onCopyLink}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-2"
      >
        <Copy className="h-3.5 w-3.5" /> {copied ? "Link Copied!" : "Copy Link"}
      </button>
      <div className="my-1 border-t border-border/60" />
      <button
        type="button"
        onClick={onDuplicate}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-2"
      >
        <Copy className="h-3.5 w-3.5" /> Duplicate Job
      </button>
      <div className="my-1 border-t border-border/60" />
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  </>
);

const Metric = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="text-sm font-semibold leading-none">{value}</div>
    <div className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const Tag = ({ children }) => (
  <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">
    {children}
  </span>
);

export default ManageJobCard;
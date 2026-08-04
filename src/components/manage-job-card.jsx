import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  BadgeCheck,
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
  const [menuPos, setMenuPos] = useState(null);
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
  const isVerified = job.company?.verification_status === "verified";

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

  const MENU_WIDTH = 176; // matches the w-44 popup below
  const MENU_HEIGHT_ESTIMATE = 190;

  const openMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      setMenuPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;
    left = Math.min(Math.max(8, left), window.innerWidth - MENU_WIDTH - 8);
    let top = rect.bottom + 6;
    if (top + MENU_HEIGHT_ESTIMATE > window.innerHeight) {
      top = Math.max(8, rect.top - MENU_HEIGHT_ESTIMATE - 6);
    }
    setMenuPos({ top, left });
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuPos(null);
  };

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
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <span className="truncate text-muted-foreground">{job.company?.name}</span>
            {isVerified && (
              <BadgeCheck className="h-3 w-3 shrink-0 text-cyan" aria-label="Verified company" />
            )}
          </span>
          <span className="shrink-0 text-muted-foreground/40">•</span>
          <span className="flex shrink-0 items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
            <span className={cn("font-medium", statusStyle.text)}>{statusStyle.label}</span>
          </span>
          {hasAttention && (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning"
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

  const actionsColumnIcons = (
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
          onClick={openMenu}
        />
        {menuOpen && (
          <ActionsMenu
            position={menuPos}
            onClose={closeMenu}
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

  const actionsColumnLabeled = (
    <div className="flex flex-wrap items-center gap-1">
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
          onClick={openMenu}
        />
        {menuOpen && (
          <ActionsMenu
            position={menuPos}
            onClose={closeMenu}
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

  // ---- Mobile card ----
  // Phones always get this one compact layout regardless of the grid/list
  // toggle (that toggle is desktop-only — see md:hidden below). Inline
  // metrics + icon-only actions keep it dense and readable on narrow screens.
  const mobileCard = (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-[var(--shadow-1)] transition-opacity md:hidden",
        busy && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{jobColumn}</div>
        {actionsColumnIcons}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-xs">
        <MetricInline label="Applied" value={metrics.applicants} />
        <MetricInline label="Interview" value={metrics.interviews} />
        <MetricInline label="Offer" value={metrics.offers} />
        <MetricInline label="Hired" value={metrics.hired} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {activityColumn}
        {tagsColumn}
      </div>
    </div>
  );

  // ---- Desktop: list view — single-line table row, fixed columns shared ----
  // ---- with the header rendered by jobs.jsx (LIST_GRID_TEMPLATE).      ----
  if (isList) {
    return (
      <>
        {mobileCard}
        <div
          className={cn(
            "hidden items-center gap-5 rounded-[var(--radius-card)] border border-border bg-card px-3 py-2.5 shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] md:grid",
            busy && "opacity-70"
          )}
          style={{ gridTemplateColumns: LIST_GRID_TEMPLATE }}
        >
          {jobColumn}
          {metricsColumn}
          {activityColumn}
          {tagsColumn}
          {actionsColumnIcons}
        </div>
      </>
    );
  }

  // ---- Desktop: grid view — fuller vertical card ----
  return (
    <>
      {mobileCard}
      <div
        className={cn(
          "hidden flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] md:flex",
          busy && "opacity-70"
        )}
      >
        {jobColumn}
        <div className="rounded-lg bg-surface-2/40 p-2">{metricsColumn}</div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {activityColumn}
          {tagsColumn}
        </div>
        <div className="border-t border-border/60 pt-2.5">{actionsColumnLabeled}</div>
      </div>
    </>
  );
};

// Rendered through a portal straight into <body> and positioned with
// `fixed` at the exact coordinates of the button that opened it (passed
// in via `position`), so it always appears right under that job's own
// 3-dot button — never full-screen — and can't be clipped by a card's
// own overflow or the page's scroll container. Same compact size on
// mobile and desktop.
const ActionsMenu = ({ position, onClose, onShare, onCopyLink, onDuplicate, onDelete, copied }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!position) return null;

  return createPortal(
    <>
      {/* invisible click-catcher to close on outside click — no dark overlay */}
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 w-44 rounded-[var(--radius-dropdown)] border border-border bg-popover p-1 shadow-[var(--shadow-3)]"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
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
    </>,
    document.body
  );
};

const Metric = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="text-sm font-semibold leading-none">{value}</div>
    <div className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const MetricInline = ({ label, value }) => (
  <span className="flex items-baseline gap-1 text-muted-foreground">
    <span className="text-sm font-semibold leading-none text-foreground">{value}</span>
    <span className="text-[10px] uppercase tracking-wide">{label}</span>
  </span>
);

const Tag = ({ children }) => (
  <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">
    {children}
  </span>
);

export default ManageJobCard;
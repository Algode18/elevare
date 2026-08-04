import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MoreHorizontal, Download, ExternalLink, Undo2, Briefcase } from "lucide-react";
import { stageColor } from "@/components/pipeline-progress";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const STAGE_LABEL = {
  applied: "Applied",
  reviewed: "Reviewed",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const STAGE_ORDER = ["applied", "reviewed", "interviewing", "offer", "hired"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function timeInStageLabel(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "for 1 day";
  return `for ${days} days`;
}

// Compact ~220px card — one status color, one thin real-progress bar (how
// far along the actual stage list this application is), a couple of real
// meta chips, and a three-dot menu with actions that all hit real
// endpoints (download resume / open job / withdraw). No fabricated
// "health score" or invented interview time.
const ApplicationPipelineCard = ({ application, onOpenJourney, onWithdrawn = () => {} }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { job, status, created_at, status_changed_at, experience, skills } = application;
  const color = stageColor(status);
  const stageIdx = STAGE_ORDER.indexOf(status);
  const progressPct = status === "rejected" ? 100 : stageIdx >= 0 ? ((stageIdx + 1) / STAGE_ORDER.length) * 100 : 0;
  // Real, not estimated: only rendered once the DB actually has a
  // status_changed_at value (see supabase/migrations/20260727_add_status_changed_at.sql).
  // Older rows created before that migration ran won't have one until their
  // status next changes — we simply omit the line rather than guess.
  const timeInStage = status_changed_at ? timeInStageLabel(status_changed_at) : null;

  const handleDownload = () => {
    if (!application?.resume) return;
    const link = document.createElement("a");
    link.href = application.resume;
    link.target = "_blank";
    link.click();
    setMenuOpen(false);
  };

  // Opens the in-app confirm card instead of the browser's native
  // window.confirm() popup.
  const handleWithdrawClick = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    setConfirmOpen(false);
    setWithdrawing(true);
    try {
      await onWithdrawn(application.id);
    } catch (err) {
      // Withdraw failed (e.g. blocked by a Supabase RLS policy) — put the
      // card back and show it in the same on-brand dialog rather than a
      // native alert().
      setWithdrawing(false);
      setErrorMsg(err?.message || "Could not withdraw application. Please try again.");
    }
  };

  const skillList = typeof skills === "string" ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={withdrawing ? { opacity: 0, scale: 0.94 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group relative flex min-h-[210px] flex-col justify-between gap-3 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-1)] transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-2)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {job?.company?.logo_url ? (
            <img src={job.company.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 object-contain p-1" />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold">
              {job?.company?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-muted-foreground">{job?.company?.name || "Company"}</div>
            {job?.location && <div className="truncate text-[11px] text-muted-foreground/70">{job.location}</div>}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More actions"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-[var(--radius-dropdown)] border border-border bg-popover py-1 shadow-[var(--shadow-3)]">
              {application.resume && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Download resume
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/dashboard/jobs?job=${application.job_id}`)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open job
              </button>
              <button
                type="button"
                onClick={handleWithdrawClick}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive-bg"
              >
                <Undo2 className="h-3.5 w-3.5" /> Withdraw
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-bold leading-snug text-heading">{job?.title}</h3>
        <span
          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: `${color}1f`, color }}
        >
          {STAGE_LABEL[status] || status}
        </span>
      </div>

      {/* Thin real progress bar — how far this application is through the
          actual known stage list, not an invented score. */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {(experience || skillList.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {experience && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Briefcase className="h-2.5 w-2.5" /> {experience}y exp
            </span>
          )}
          {skillList.slice(0, 2).map((s) => (
            <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          Applied {timeAgo(created_at)}
          {timeInStage && status !== "applied" && <> · in stage {timeInStage}</>}
        </span>
        <button
          type="button"
          onClick={() => onOpenJourney(application)}
          className="text-xs font-medium text-primary hover:underline"
        >
          View journey →
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Withdraw this application?"
        description="This can't be undone. You'll need to re-apply if you change your mind."
        confirmLabel="Withdraw"
        destructive
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={!!errorMsg}
        title="Couldn't withdraw"
        description={errorMsg}
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setErrorMsg(null)}
        onCancel={() => setErrorMsg(null)}
      />
    </motion.div>
  );
};

export default ApplicationPipelineCard;
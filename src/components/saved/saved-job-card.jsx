import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Heart, MapPin, Eye, Send, Trash2 } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { saveJob } from "@/api/apiJobs";
import { shortenSalaryRange } from "@/lib/utils";

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Compact, information-dense card (~180px) — logo/company/heart on top,
// title, a couple of real skill/mode chips, saved date, and three
// hover-only quick actions. No empty filler space by design.
const SavedJobCard = ({ job, savedAt, onRemoved = () => {} }) => {
  const [removed, setRemoved] = useState(false);
  const [pulse, setPulse] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const { loading, fn: fnUnsave } = useFetch(saveJob, { alreadySaved: true });

  const handleUnsave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPulse(true);
    setTimeout(async () => {
      setRemoved(true);
      await onRemoved(job.id);
    }, 180);
  };

  // A saved job only ever belongs to a signed-in candidate, so this should
  // always take the in-app branch in practice — kept as a fallback to
  // /jobs/:id (rather than assuming) in case this card is ever reused
  // somewhere reachable while signed out.
  const goToJob = (e) => {
    e?.stopPropagation();
    navigate(isSignedIn ? `/dashboard/jobs?job=${job.id}` : `/jobs/${job.id}`);
  };

  // Salary gets its own bright line; work mode / skills stay as chips —
  // kept to a single row so the card never grows past ~180px.
  const shortSalary = shortenSalaryRange(job.salary_range);
  const chips = [job.job_type, job.work_mode, ...(Array.isArray(job.skills) ? job.skills : [])]
    .filter(Boolean)
    .slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={removed ? { opacity: 0, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={goToJob}
      className="group relative flex h-[180px] cursor-pointer flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-1)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-2)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {job.company?.logo_url ? (
            <img
              src={job.company.logo_url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 object-contain p-1 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold transition-transform duration-300 group-hover:scale-110">
              {job.company?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-muted-foreground">{job.company?.name || "Company"}</div>
            {job.location && (
              <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground/70">
                <MapPin className="h-2.5 w-2.5 shrink-0" /> {job.location}
              </div>
            )}
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleUnsave}
          disabled={loading}
          aria-label="Remove from wishlist"
          animate={pulse ? { scale: [1, 1.35, 1] } : {}}
          transition={{ duration: 0.35 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EC4899]/15 text-[#EC4899] transition-transform hover:scale-110"
        >
          <Heart className="h-3.5 w-3.5 fill-[#EC4899]" />
        </motion.button>
      </div>

      <div className="relative min-w-0">
        <h3 className="truncate text-base font-bold leading-snug">{job.title}</h3>
        {!job.isOpen && <div className="mt-0.5 text-[11px] text-destructive">Closed</div>}
      </div>

      <div className="relative flex items-center justify-between gap-2">
        {shortSalary && <span className="shrink-0 text-xs font-semibold text-cyan">💰 {shortSalary}</span>}
        <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Saved {timeAgo(savedAt)}</span>

        {/* Quick actions — hover only, icons, minimal */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={goToJob}
            aria-label="View details"
            className="grid h-6 w-6 place-items-center rounded-[14px] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={goToJob}
            aria-label="Apply"
            className="grid h-6 w-6 place-items-center rounded-[14px] text-primary hover:bg-primary/10"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleUnsave}
            aria-label="Remove"
            className="grid h-6 w-6 place-items-center rounded-[14px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SavedJobCard;
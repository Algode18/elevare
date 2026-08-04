import { useUser } from "@clerk/react";
import { Bookmark, MapPinIcon, Clock, Trash2Icon, Zap, BadgeCheck, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch";
import { deleteJob, saveJob } from "@/api/apiJobs";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { shortenSalaryRange } from "@/lib/utils";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Maps a meta chip's text to the Frosted Ivory tag palette (Remote = blue,
// Full Time = purple, everything else falls back to the neutral surface chip).
const chipTone = (chip) => {
  const v = String(chip).toLowerCase();
  if (v.includes("remote")) return "bg-tag-remote-bg text-tag-remote-text";
  if (v.includes("full")) return "bg-tag-fulltime-bg text-tag-fulltime-text";
  if (v.includes("urgent")) return "bg-tag-urgent-bg text-tag-urgent-text";
  return "bg-surface-2 text-foreground/80";
};

// Same rotating accent palette as the Discover Jobs match tiles
// (components/discover/job-match-tile.jsx) — pass an `index` prop from a
// .map() if you want the colors to cycle; defaults to the first accent.
const ACCENTS = [
  "oklch(0.68 0.19 293 / 0.22)",
  "oklch(0.82 0.14 200 / 0.22)",
  "oklch(0.88 0.19 128 / 0.22)",
  "oklch(0.82 0.18 78 / 0.22)",
];

// Matches the visual language of the Discover Jobs match tiles (glass
// card, glow-on-hover, bookmark save icon, "Explore →" footer) so a job
// looks the same everywhere it appears — jobs.jsx, saved.jsx,
// created-jobs.jsx, and company-details.jsx all render this same
// component with the same props as before, so none of them need to change.
const JobCard = ({
  job,
  index = 0,
  isMyJob = false,
  savedInit = false,
  onJobSaved = () => {},
}) => {
  const [saved, setSaved] = useState(savedInit);
  const navigate = useNavigate();
  const glow = ACCENTS[index % ACCENTS.length];

  useEffect(() => setSaved(savedInit), [savedInit]);

  const {
    loading: loadingSavedJob,
    data: savedJob,
    fn: fnSavedJob,
  } = useFetch(saveJob, {
    alreadySaved: saved,
  });

  const { user, isSignedIn } = useUser();

  const { loading: loadingDeleteJob, fn: fnDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });

  const handleDeleteJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await fnDeleteJob();
    onJobSaved();
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    await fnSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    onJobSaved();
  };

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  // Always a string (never empty) so the snippet block below renders with
  // the same footprint on every card — that's what keeps a row of cards
  // level regardless of which jobs happen to have a description.
  const snippet = job.description
    ? job.description.split(".").slice(0, 1).join(".") + "."
    : "No description provided for this role yet.";
  const posted = timeAgo(job.created_at) || "Recently";
  const isVerified = job.company?.verification_status === "verified";
  const shortSalary = shortenSalaryRange(job.salary_range);

  // Job type first, then work mode, then a top skill — three chips max so
  // the row scans in one glance and never wraps to a third line.
  const metaChips = [
    job.job_type || "Full-time",
    job.work_mode,
    Array.isArray(job.skills) ? job.skills[0] : null,
  ].filter(Boolean);

  // Signed-in candidates stay inside the workspace — open the job in the
  // Discover Jobs drawer instead of navigating to the public full page.
  // Recruiters viewing their own postings (isMyJob) and signed-out guests
  // both keep the original public-page link.
  const jobLinkTo =
    !isMyJob && isSignedIn ? `/dashboard/jobs?job=${job.id}` : `/jobs/${job.id}`;

  return (
    <Link
      to={jobLinkTo}
      className="group relative flex h-full flex-col gap-3.5 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-[var(--shadow-1)] transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-2)] active:scale-[0.98]"
      style={{ "--tile-glow": glow }}
    >
      {loadingDeleteJob && <BarLoader width={"100%"} color="var(--primary)" className="absolute inset-x-0 top-0" />}

      {/* glow blob, fades in on hover — same effect as job-match-tile.jsx */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "var(--tile-glow)" }}
      />
      {/* faint press glow, matches --tile-glow, shows only while tapping */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[inset_0_0_0_1px_var(--tile-glow)] transition-opacity duration-150 group-active:opacity-100"
      />

      {/* Header — logo left, title is the dominant element, company/location
          collapse onto a single muted line beneath it. Save/delete top-right. */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {job.company?.logo_url ? (
            <img
              src={job.company.logo_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl bg-surface-2 object-contain p-1.5 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-semibold">
              {job.company?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-semibold leading-snug group-hover:text-primary">{job.title}</h3>
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
              <span className="truncate">{job.company?.name || "Company"}</span>
              {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-label="Verified company" />}
              <span className="shrink-0 text-muted-foreground/50">•</span>
              <span className="flex shrink-0 items-center gap-0.5">
                <MapPinIcon className="h-3 w-3" /> {job.location || "Remote"}
              </span>
            </div>
            {!job.isOpen && (
              <span className="mt-1.5 inline-block rounded-full bg-tag-closed-bg px-2 py-0.5 text-xs text-tag-closed-text">
                Closed
              </span>
            )}
          </div>
        </div>

        {isMyJob ? (
          <button
            type="button"
            onClick={handleDeleteJob}
            aria-label="Delete job"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
            aria-label={saved ? "Unsave job" : "Save job"}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50 ${
              saved ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground hover:bg-surface-2/80 hover:text-foreground"
            }`}
          >
            <Bookmark className={`h-4 w-4 transition-transform duration-300 ${saved ? "fill-primary rotate-12" : ""}`} />
          </button>
        )}
      </div>

      {/* Snippet — always rendered, always 2 lines tall, so every card in
          the row reserves identical space here whether the job has a
          long, short, or missing description. */}
      <p className="relative line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{snippet}</p>

      {/* Chip row — job type, work mode, top skill: up to three, scan-friendly */}
      <div className="relative flex flex-wrap items-center gap-1.5">
        {metaChips.map((chip, i) => (
          <span key={`${chip}-${i}`} className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${chipTone(chip)}`}>
            {chip}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {posted}
        </span>
      </div>

      {/* Footer — pinned to the bottom with mt-auto, salary bright on the
          left, Easily Apply styled as a lightweight button on the right. */}
      <div className="relative mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-sm font-semibold text-cyan">
          {shortSalary ? `💰 ${shortSalary}` : "Salary not listed"}
        </span>
        {!isMyJob && job.isOpen ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-all duration-300 group-hover:bg-primary/15 group-hover:translate-x-0.5">
            <Zap className="h-3.5 w-3.5 fill-primary" /> Easily Apply <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1">
            Explore →
          </span>
        )}
      </div>
    </Link>
  );
};

export default JobCard;
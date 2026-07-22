import { useUser } from "@clerk/react";
import { Heart, MapPinIcon, IndianRupee, Clock, Trash2Icon, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import useFetch from "@/hooks/use-fetch";
import { deleteJob, saveJob } from "@/api/apiJobs";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Indeed-style job row: logo + title/company/location on top, a short
// snippet, then a chip row (salary, job type, posted time). Same props as
// before so jobs.jsx / saved.jsx / created-jobs.jsx / company-details.jsx
// don't need to change.
const JobCard = ({
  job,
  isMyJob = false,
  savedInit = false,
  onJobSaved = () => {},
}) => {
  const [saved, setSaved] = useState(savedInit);
  const navigate = useNavigate();

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
      navigate("/?sign-in=true");
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

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="hairline hover-lift group relative flex h-full flex-col rounded-xl bg-surface/60 p-5"
    >
      {loadingDeleteJob && <BarLoader width={"100%"} color="#7c5cff" className="absolute inset-x-0 top-0" />}

      {/* Header — title clamped to 1 line so a long title never pushes
          this card taller than its neighbors. */}
      <div className="flex items-start gap-3">
        {job.company?.logo_url ? (
          <img src={job.company.logo_url} className="h-10 w-10 shrink-0 rounded-md bg-white/5 object-contain p-1" alt="" />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-primary to-cyan" />
        )}

        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-base font-semibold group-hover:text-primary">{job.title}</div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">{job.company?.name}</div>
        </div>

        {isMyJob ? (
          <button
            type="button"
            onClick={handleDeleteJob}
            aria-label="Delete job"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
            aria-label="Save job"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 disabled:opacity-50"
          >
            <Heart className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </button>
        )}
      </div>

      {/* Snippet — always rendered, always 2 lines tall, so every card in
          the row reserves identical space here whether the job has a
          long, short, or missing description. */}
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
        {snippet}
      </p>

      {/* Chip row — same slots, same order, every time, with neutral
          fallbacks instead of just omitting a chip. That's what keeps
          this row from shrinking when a job is missing salary_range or
          job_type. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPinIcon className="h-3 w-3" /> {job.location || "Remote"}
        </span>
        <span className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3" /> {job.salary_range || "Not disclosed"}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5">{job.job_type || "Full-time"}</span>
        {!job.isOpen && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Closed</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" /> {posted}
        </span>
      </div>

      {/* Footer — pinned to the bottom with mt-auto so every card's last
          row sits on the same baseline; an invisible spacer keeps "my
          jobs" cards level with candidate cards that do show a badge. */}
      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
        {!isMyJob && job.isOpen ? (
          <>
            <Zap className="h-3 w-3 fill-primary" /> Easily Apply
          </>
        ) : (
          <span className="invisible">spacer</span>
        )}
      </div>
    </Link>
  );
};

export default JobCard;
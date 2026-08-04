import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ThumbsDown, MapPin, ArrowRight, BadgeCheck } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { saveJob } from "@/api/apiJobs";
import { shortenSalaryRange } from "@/lib/utils";

// Indeed-style job list card: badge top-left, bookmark + not-interested
// stacked top-right, title/company/location stacked, then a wrapping row
// of chips (salary first, then benefits). Selected state gets the same
// blue-ring treatment Indeed uses on the active card in its list.
const JobRowCard = ({
  job,
  isSelected,
  onSelect,
  savedInit = false,
  onJobSaved = () => {},
  onNotInterested = () => {},
}) => {
  const [saved, setSaved] = useState(savedInit);
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => setSaved(savedInit), [savedInit]);

  const { loading: loadingSave, data: savedResult, fn: fnSaveJob } = useFetch(saveJob, {
    alreadySaved: saved,
  });

  useEffect(() => {
    if (savedResult !== undefined) setSaved(savedResult?.length > 0);
  }, [savedResult]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    await fnSaveJob({ user_id: user.id, job_id: job.id });
    onJobSaved();
  };

  const handleNotInterested = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onNotInterested(job.id);
  };

  const isVerified = job.company?.verification_status === "verified";
  const shortSalary = shortenSalaryRange(job.salary_range);

  // Job type / work mode / benefits — salary now lives in its own bright
  // line below the title, so this row is purely scan chips.
  const chips = [job.job_type, job.work_mode, ...(Array.isArray(job.benefits) ? job.benefits : [])]
    .filter(Boolean)
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onSelect(job.id)}
      className={`relative flex w-full flex-col gap-2.5 rounded-xl border bg-surface/60 p-4 text-left transition-all active:scale-[0.98] ${
        isSelected
          ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
          : "border-border hover:border-border-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {job.isOpen ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            ⚡ Easily Apply <ArrowRight className="h-3 w-3" />
          </span>
        ) : (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">Closed</span>
        )}
        <div className="ml-auto flex flex-col items-center gap-1.5">
          <span
            role="button"
            tabIndex={0}
            onClick={handleSave}
            aria-label={saved ? "Unsave job" : "Save job"}
            aria-disabled={loadingSave}
            className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
              saved ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground hover:bg-surface-2/80 hover:text-foreground"
            }`}
          >
            <Bookmark className={saved ? "h-3.5 w-3.5 fill-primary" : "h-3.5 w-3.5"} />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={handleNotInterested}
            aria-label="Not interested"
            className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-muted-foreground hover:bg-surface-2/80 hover:text-foreground"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-base font-bold leading-snug">{job.title}</div>
        <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <span className="truncate">{job.company?.name}</span>
          {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-label="Verified company" />}
          <span className="shrink-0 text-muted-foreground/50">•</span>
          <span className="flex shrink-0 items-center gap-0.5">
            <MapPin className="h-3 w-3" /> {job.location || "Remote"}
          </span>
        </div>
      </div>

      {shortSalary && <div className="text-sm font-semibold text-cyan">💰 {shortSalary}</div>}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={`${c}-${i}`} className="rounded-md bg-surface-2 px-2 py-1 text-xs text-foreground/80">
              {c}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

export default JobRowCard;
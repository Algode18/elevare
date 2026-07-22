import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ThumbsDown } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { saveJob } from "@/api/apiJobs";

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
      navigate("/?sign-in=true");
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

  // Salary first, then benefits — same chip treatment for every entry so
  // the row never jumps around depending on which fields a job has.
  const chips = [job.salary_range, ...(Array.isArray(job.benefits) ? job.benefits : [])].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onSelect(job.id)}
      className={`relative flex w-full flex-col gap-2.5 rounded-xl border bg-surface/60 p-4 text-left transition-colors ${
        isSelected
          ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
          : "border-border hover:border-border-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {job.isOpen && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Easily apply
          </span>
        )}
        <div className="ml-auto flex flex-col items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={handleSave}
            aria-label={saved ? "Unsave job" : "Save job"}
            aria-disabled={loadingSave}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <Bookmark className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={handleNotInterested}
            aria-label="Not interested"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <ThumbsDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div>
        <div className="text-base font-semibold leading-snug">{job.title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{job.company?.name}</div>
        <div className="text-sm text-muted-foreground">{job.location || "Remote"}</div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={`${c}-${i}`} className="rounded-md bg-surface-2 px-2 py-1 text-xs text-foreground/80">
              {c}
            </span>
          ))}
        </div>
      )}

      {!job.isOpen && (
        <span className="w-fit rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">Closed</span>
      )}
    </button>
  );
};

export default JobRowCard;
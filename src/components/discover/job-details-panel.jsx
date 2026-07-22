import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import MDEditor from "@uiw/react-md-editor";
import { BarLoader } from "react-spinners";
import {
  Briefcase,
  MapPin,
  Clock,
  Bookmark,
  ThumbsDown,
  Share2,
  Flag,
  Building2,
  ExternalLink,
  Users,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { getSingleJob, saveJob } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import ApplyJobDrawer from "@/components/apply-job";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Renders full job detail for whichever job is currently selected in the
// Discover Jobs list — same data + apply/save logic as the standalone
// /jobs/:id page.
//
// This component does NOT own its own scrollbar. The header below is
// `sticky top-0`, which only does anything useful once *something*
// scrolls — so the caller is expected to put this inside a scrolling
// container (the sticky card on desktop, the drawer body on mobile).
// That keeps the "header stays put, body scrolls under it" behaviour
// consistent in both places without this component needing to know
// which one it's in.
const JobDetailsPanel = ({ jobId, onNotInterested = () => {} }) => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { loading: loadingJob, data: job, fn: fnJob } = useFetch(getSingleJob, {
    job_id: jobId,
  });

  useEffect(() => {
    if (jobId) fnJob();
  }, [jobId]);

  const { savedIdSet } = useSavedJobIds();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(savedIdSet.has(Number(jobId)) || savedIdSet.has(jobId));
  }, [savedIdSet, jobId]);

  const { loading: loadingSaveJob, data: savedJobResult, fn: fnSaveJob } = useFetch(saveJob, {
    alreadySaved: saved,
  });

  useEffect(() => {
    if (savedJobResult !== undefined) setSaved(savedJobResult?.length > 0);
  }, [savedJobResult]);

  const handleSaveJob = () => {
    if (!isSignedIn) {
      navigate("/?sign-in=true");
      return;
    }
    fnSaveJob({ user_id: user.id, job_id: jobId });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: job?.title, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingJob !== false || !job) {
    return (
      <div className="p-6">
        <BarLoader width={"100%"} color="#7c5cff" />
        <div className="mt-4 animate-pulse space-y-3">
          <div className="h-6 w-2/3 rounded bg-surface-2" />
          <div className="h-4 w-1/3 rounded bg-surface-2" />
          <div className="mt-4 h-24 w-full rounded bg-surface-2" />
        </div>
      </div>
    );
  }

  const isOwner = isSignedIn && job?.recruiter_id === user?.id;
  const posted = timeAgo(job?.created_at);

  return (
    <div>
      {/* Pinned header — title, quick facts, and the action row stay put
          (sticky to whichever ancestor is actually scrolling) while the
          body underneath scrolls. */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface/95 p-6 pb-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight sm:text-[1.75rem]">{job.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {job.company?.name && (
                <Link
                  to={`/companies/${job.company_id}`}
                  className="flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  {job.company.name} <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <span>|</span>
              <span>{job.location || "Remote"}</span>
              {job.salary_range && (
                <>
                  <span>|</span>
                  <span>{job.salary_range}</span>
                </>
              )}
              {posted && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {posted}
                </span>
              )}
            </div>
          </div>
          {job.company?.logo_url ? (
            <img src={job.company.logo_url} className="h-11 w-11 shrink-0 rounded-xl bg-white/5 object-contain p-1.5" alt="" />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isSignedIn && !isOwner && (
            <div className="min-w-[170px]">
              <ApplyJobDrawer
                job={job}
                user={user}
                fetchJob={fnJob}
                applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
              />
            </div>
          )}
          {!isSignedIn && (
            <Link to="/?sign-in=true" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Sign in to Apply
            </Link>
          )}

          <button
            type="button"
            onClick={handleSaveJob}
            disabled={loadingSaveJob}
            aria-label="Save job"
            className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => onNotInterested(jobId)}
            aria-label="Not interested"
            className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share job"
            className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </button>
          {copied && <span className="text-xs text-muted-foreground">Link copied</span>}

          {isOwner && job?.applications?.length > 0 && (
            <Link
              to={`/employer/jobs/${job.id}/applicants`}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15"
            >
              <Users className="h-3.5 w-3.5" /> Manage Applicants
            </Link>
          )}
        </div>
      </div>

      {/* Body — flows normally underneath the sticky header */}
      <div className="flex flex-col gap-6 p-6">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">Job details</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Here's how the job details align with your <Link to="/profile" className="underline">profile</Link>.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {job.salary_range && (
              <div className="flex items-center gap-3 text-sm">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-1 items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  {job.salary_range}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-1 items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                {job.job_type || "Full-time"}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </div>
            {job.work_mode && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-1 items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  {job.work_mode}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </div>
            )}
          </div>
        </div>

        {Array.isArray(job.benefits) && job.benefits.length > 0 && (
          <div>
            <h3 className="mb-2 text-base font-semibold">Benefits</h3>
            <p className="mb-2 text-xs text-muted-foreground">Pulled from the full job description</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {job.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-base font-semibold">Full job description</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        </div>

        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div>
            <h3 className="mb-2 text-base font-semibold">Required skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-base font-semibold">What we're looking for</h3>
          <div data-color-mode="dark">
            <MDEditor.Markdown source={job.requirements} className="bg-transparent text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" /> {job.applications?.length || 0} applicants
          <span className={`ml-2 rounded-full px-2.5 py-1 text-xs ${job.isOpen ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {job.isOpen ? "Open" : "Closed"}
          </span>
        </div>

        <a
          href={`mailto:support.elevare.app@gmail.com?subject=Reporting job: ${encodeURIComponent(job.title || "")}`}
          className="flex w-fit items-center gap-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" /> Report job
        </a>
      </div>
    </div>
  );
};

export default JobDetailsPanel;
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import MDEditor from "@uiw/react-md-editor";
import { useResolvedTheme } from "@/components/theme-provider";
import { BarLoader } from "react-spinners";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Bookmark,
  ThumbsDown,
  Share2,
  Flag,
  Building2,
  Users,
  Wallet,
  BadgeCheck,
  DoorOpen,
  DoorClosed,
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
const JobDetailsPanel = ({ jobId, onNotInterested = () => {}, onBack = () => {} }) => {
  const { user, isSignedIn } = useUser();
  const resolvedTheme = useResolvedTheme();
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
      navigate("/sign-in");
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
        <BarLoader width={"100%"} color="var(--primary)" />
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
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Discover
        </button>

        <div className="flex items-start gap-3">
          {job.company?.logo_url ? (
            <img src={job.company.logo_url} className="h-14 w-14 shrink-0 rounded-xl bg-surface-2 object-contain p-1.5" alt="" />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-2xl leading-tight">{job.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              {job.company?.name && (
                <>
                  <Link
                    to={`/companies/${job.company_id}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Building2 className="h-3.5 w-3.5" /> {job.company.name}
                  </Link>
                  {job.company?.verification_status === "verified" && (
                    <BadgeCheck className="h-3.5 w-3.5 text-cyan" aria-label="Verified company" />
                  )}
                  <span aria-hidden>•</span>
                </>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location || "Remote"}
              </span>
              {posted && (
                <>
                  <span aria-hidden>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {posted}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {isSignedIn && !isOwner && (
            <ApplyJobDrawer
              job={job}
              user={user}
              fetchJob={fnJob}
              applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
            />
          )}
          {!isSignedIn && (
            <Link to="/sign-in" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Sign in to Apply
            </Link>
          )}

          <button
            type="button"
            onClick={handleSaveJob}
            disabled={loadingSaveJob}
            aria-label="Save job"
            className="hairline grid h-11 w-11 place-items-center rounded-md transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            <Bookmark className={`h-4 w-4 transition-transform duration-300 ${saved ? "fill-primary rotate-12" : "text-muted-foreground"}`} />
          </button>

          <button
            type="button"
            onClick={() => onNotInterested(jobId)}
            aria-label="Not interested"
            className="hairline grid h-11 w-11 place-items-center rounded-md transition-colors hover:border-primary/50"
          >
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share job"
            className="hairline grid h-11 w-11 place-items-center rounded-md transition-colors hover:border-primary/50"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
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

        {/* Applicant count + hiring status as compact pills, right under the
            action row — same placement and colors as the public job page. */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="hairline inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {job?.applications?.length || 0} Applicants
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium ${
              job?.isOpen ? "bg-tag-hiring-bg text-tag-hiring-text" : "bg-tag-closed-bg text-tag-closed-text"
            }`}
          >
            {job?.isOpen ? <DoorOpen className="h-3.5 w-3.5" /> : <DoorClosed className="h-3.5 w-3.5" />}
            {job?.isOpen ? "Hiring Now" : "Closed"}
          </span>
        </div>
      </div>

      {/* Body — flows normally underneath the sticky header */}
      <div className="flex flex-col gap-6 p-6">
        {(job.salary_range || job.job_type || job.work_mode) && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">Job details</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Here's how the job details align with your <Link to="/profile" className="underline">profile</Link>.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {job.salary_range && (
              <div className="flex items-center gap-3 text-sm">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-1 items-center rounded-lg bg-surface-2 px-3 py-2">
                  {job.salary_range}
                </span>
              </div>
            )}
            {job.job_type && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-1 items-center rounded-lg bg-surface-2 px-3 py-2">
                  {job.job_type}
                </span>
              </div>
            )}
            {job.work_mode && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-1 items-center rounded-lg bg-surface-2 px-3 py-2">
                  {job.work_mode}
                </span>
              </div>
            )}
          </div>
        </div>
        )}

        <div>
          <h3 className="mb-2 text-base font-semibold">About the job</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        </div>

        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div>
            <h3 className="mb-2 text-base font-semibold">Skills required</h3>
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
          <h3 className="mb-2 text-base font-semibold">What we are looking for</h3>
          <div data-color-mode="dark">
            <MDEditor.Markdown source={job.requirements} className="bg-transparent text-sm" data-color-mode={resolvedTheme} />
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

        <Link
          to="/contact"
          className="flex w-fit items-center gap-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" /> Report job
        </Link>
      </div>
    </div>
  );
};

export default JobDetailsPanel;
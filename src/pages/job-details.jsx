import { useEffect, useState } from "react";
import { getSingleJob, UpdateHiringStatus, saveJob } from "@/api/apiJobs";
import usePublicFetch from "@/hooks/use-public-fetch";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import { useUser } from "@clerk/react";
import MDEditor from "@uiw/react-md-editor";
import {
  Briefcase,
  DoorClosed,
  DoorOpen,
  MapPinIcon,
  Heart,
  Share2,
  Clock,
  IndianRupee,
  Flag,
  Users,
} from "lucide-react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ApplyJobDrawer from "@/components/apply-job";
import BackButton from "@/components/back-button";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Public job detail page — anyone can read it. Applying, saving, and the
// recruiter hiring-status control require an authenticated session.
const JobDetailsPage = () => {
  const { isLoaded, user, isSignedIn } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [copied, setCopied] = useState(false);

  const { loading: loadingJob, data: job, fn: fnJob } = usePublicFetch(getSingleJob, {
    job_id: id,
  });

  const { savedIdSet } = useSavedJobIds();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(savedIdSet.has(Number(id)) || savedIdSet.has(id));
  }, [savedIdSet, id]);

  const {
    loading: loadingSaveJob,
    data: savedJobResult,
    fn: fnSaveJob,
  } = useFetch(saveJob, { alreadySaved: saved });

  useEffect(() => {
    if (savedJobResult !== undefined) setSaved(savedJobResult?.length > 0);
  }, [savedJobResult]);

  const handleSaveJob = () => {
    if (!isSignedIn) {
      navigate("/?sign-in=true");
      return;
    }
    fnSaveJob({ user_id: user.id, job_id: id });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: job?.title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard as a no-op
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(UpdateHiringStatus, {
    job_id: id,
  });

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then(() => fnJob());
  };

  useEffect(() => {
    fnJob();
  }, [id]);

  if (loadingJob !== false) {
    return <BarLoader className="mx-6 mt-8" width={"95%"} color="#7c5cff" />;
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Job not found</h1>
        <Link to="/jobs" className="mt-4 inline-block text-primary underline">
          Back to all jobs
        </Link>
      </div>
    );
  }

  const isOwner = isSignedIn && job?.recruiter_id === user?.id;
  const posted = timeAgo(job?.created_at);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 flex flex-col gap-8">
      <BackButton
        fallbackTo={isPreview ? "/employer/jobs" : "/jobs"}
        label={isPreview ? "Back to Manage Jobs" : "Back to Jobs"}
      />
      {/* Header — title, company, quick facts */}
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between md:items-start">
        <div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl">{job?.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {job?.company?.name && (
              <Link to={`/companies/${job.company_id}`} className="text-primary underline underline-offset-2">
                {job.company.name}
              </Link>
            )}
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" /> {job?.location}
            </span>
            {job?.salary_range && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" /> {job.salary_range}
              </span>
            )}
            {posted && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {posted}
              </span>
            )}
          </div>
        </div>
        {job?.company?.logo_url && (
          <img src={job.company.logo_url} className="h-12 shrink-0" alt={job?.company?.name} />
        )}
      </div>

      {/* Apply / Save / Share row */}
      <div className="flex flex-wrap items-center gap-2">
        {isSignedIn && !isOwner && (
          <ApplyJobDrawer
            job={job}
            user={user}
            fetchJob={fnJob}
            applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
          />
        )}
        {!isSignedIn && (
          <Link to="/?sign-in=true">
            <Button size="lg">Sign in to Apply</Button>
          </Link>
        )}

        <button
          type="button"
          onClick={handleSaveJob}
          disabled={loadingSaveJob}
          aria-label="Save job"
          className="hairline grid h-11 w-11 place-items-center rounded-md transition-colors hover:border-primary/50 disabled:opacity-50"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
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
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex gap-2">
          <Briefcase className="h-4 w-4" />
          {job?.applications?.length || 0} Applicants
        </div>
        <div className="flex gap-2">
          {job?.isOpen ? (
            <>
              <DoorOpen className="h-4 w-4" /> Open
            </>
          ) : (
            <>
              <DoorClosed className="h-4 w-4" /> Closed
            </>
          )}
        </div>
      </div>

      {loadingHiringStatus && <BarLoader width={"100%"} color="#7c5cff" />}
      {isOwner && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full ${job?.isOpen ? "bg-green-950 dark:bg-green-950" : "bg-red-950 dark:bg-red-950"}`}
          >
            <SelectValue placeholder={"Hiring Status" + (job?.isOpen ? " (Open)" : " (Closed)")} />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border border-zinc-700">
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Job details box — Indeed-style Pay/Job type. Renders only once Step 7
          adds these columns and an employer fills them in; harmless no-op today. */}
      {(job?.salary_range || job?.job_type || job?.work_mode) && (
        <div className="hairline rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Job details</h2>
          <div className="flex flex-col gap-3 text-sm">
            {job?.salary_range && (
              <div className="flex items-center gap-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span>{job.salary_range}</span>
              </div>
            )}
            {job?.job_type && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{job.job_type}</span>
              </div>
            )}
            {job?.work_mode && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span>{job.work_mode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">About the job</h2>
        <p className="sm:text-lg">{job?.description}</p>
      </div>

      {Array.isArray(job?.skills) && job.skills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">Skills required</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">What we are looking for</h2>
        <MDEditor.Markdown source={job?.requirements} className="bg-transparent sm:text-lg" />
      </div>

      {/* Benefits — renders once Step 7/8 add this column */}
      {Array.isArray(job?.benefits) && job.benefits.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">Benefits</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {job.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && job?.applications?.length > 0 && (
        <div className="hairline flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">
              {job.applications.length} applicant{job.applications.length === 1 ? "" : "s"}
            </div>
            <div className="text-xs text-muted-foreground">
              Review resumes, change status, and manage your pipeline in the applicants workspace.
            </div>
          </div>
          <Link
            to={`/employer/jobs/${job.id}/applicants`}
            className="flex w-fit shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Users className="h-3.5 w-3.5" /> Manage Applicants
          </Link>
        </div>
      )}

      <a
        href={`mailto:support.elevare.app@gmail.com?subject=Reporting job: ${encodeURIComponent(job?.title || "")}`}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive w-fit"
      >
        <Flag className="h-3.5 w-3.5" /> Report job
      </a>
    </div>
  );
};

export default JobDetailsPage;
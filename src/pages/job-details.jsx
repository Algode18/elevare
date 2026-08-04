import { useEffect, useRef, useState } from "react";
import { getSingleJob, UpdateHiringStatus, saveJob } from "@/api/apiJobs";
import usePublicFetch from "@/hooks/use-public-fetch";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import { useUser } from "@clerk/react";
import MDEditor from "@uiw/react-md-editor";
import { useResolvedTheme } from "@/components/theme-provider";
import {
  Briefcase,
  DoorClosed,
  DoorOpen,
  MapPinIcon,
  Bookmark,
  Share2,
  Clock,
  IndianRupee,
  Flag,
  Users,
  Building2,
  BadgeCheck,
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
  const resolvedTheme = useResolvedTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [copied, setCopied] = useState(false);
  const heroRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);

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
      navigate("/sign-in");
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

  // Sticky apply bar shows once the hero (which holds the real Apply
  // control) has scrolled out of view — keeps the CTA reachable on long
  // job descriptions without duplicating the apply flow's state.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [job]);

  const scrollToHero = () => heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loadingJob !== false) {
    return <BarLoader className="mx-6 mt-8" width={"95%"} color="var(--primary)" />;
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
  const appliedApplication = job?.applications?.find((ap) => ap.candidate_id === user?.id);
  const isCompanyVerified = job?.company?.verification_status === "verified";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6">
      <BackButton
        fallbackTo={isPreview ? "/employer/jobs" : isSignedIn ? "/" : "/jobs"}
        label={isPreview ? "Back to Manage Jobs" : isSignedIn ? "Back" : "Back to Jobs"}
      />

      {/* Hero — two columns on desktop: job info left, company panel right.
          On mobile the panel is hidden and the logo sits above the title instead. */}
      <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-10">
        <div className="flex flex-col min-w-0">
          <div className="flex items-start gap-3 lg:hidden">
            {job?.company?.logo_url && (
              <img
                src={job.company.logo_url}
                className="h-12 w-12 shrink-0 rounded-lg bg-surface-2 object-contain p-1.5"
                alt={job?.company?.name}
              />
            )}
            <h1 className="font-display font-extrabold text-2xl leading-tight tracking-tight">{job?.title}</h1>
          </div>
          <h1 className="hidden lg:block font-display font-extrabold text-4xl leading-tight tracking-tight">
            {job?.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm text-muted-foreground">
            {job?.company?.name && (
              <>
                <Link
                  to={`/companies/${job.company_id}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Building2 className="h-3.5 w-3.5" /> {job.company.name}
                </Link>
                {isCompanyVerified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-cyan" aria-label="Verified company" />
                )}
                <span aria-hidden>•</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" /> {job?.location}
            </span>
            {/* {job?.salary_range && (
              <>
                <span aria-hidden>•</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> {job.salary_range}
                </span>
              </>
            )} */}
            {posted && (
              <>
                <span aria-hidden>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {posted}
                </span>
              </>
            )}
          </div>

          {/* Apply / Save / Share row — Apply is the dominant action */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isSignedIn && !isOwner && (
              <ApplyJobDrawer job={job} user={user} fetchJob={fnJob} applied={appliedApplication} />
            )}
            {!isSignedIn && (
              <Link to="/sign-in">
                <Button size="lg" className="px-8 font-semibold shadow-[0_8px_24px_rgba(168,85,247,0.28)]">
                  Sign in to Apply
                </Button>
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
              onClick={handleShare}
              aria-label="Share job"
              className="hairline grid h-11 w-11 place-items-center rounded-md transition-colors hover:border-primary/50"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
            {copied && <span className="text-xs text-muted-foreground">Link copied</span>}
          </div>

          {/* Applicant count + hiring status as compact, equal-height pills */}
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

        {/* Company panel — desktop only; replaces the floating logo with a
            compact card so the right side of the hero isn't empty space. */}
        {job?.company && (
          <div className="hairline hidden lg:flex h-fit flex-col items-center gap-4 rounded-2xl p-6 text-center">
            {job.company.logo_url && (
              <img
                src={job.company.logo_url}
                className="h-14 w-14 rounded-lg bg-surface-2 object-contain p-1.5"
                alt={job.company.name}
              />
            )}
            <div>
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                {job.company.name}
                {isCompanyVerified && <BadgeCheck className="h-4 w-4 text-cyan" aria-label="Verified company" />}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                {job.company.industry && <span>{job.company.industry}</span>}
                {job.company.company_size && <span>{job.company.company_size} employees</span>}
                {job.company.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5" /> {job.company.headquarters}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {loadingHiringStatus && <BarLoader width={"100%"} color="var(--primary)" />}
      {isOwner && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full ${job?.isOpen ? "bg-success-bg text-success border-success-border" : "bg-destructive-bg text-destructive border-destructive-border"}`}
          >
            <SelectValue placeholder={"Hiring Status" + (job?.isOpen ? " (Open)" : " (Closed)")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Job details grid — Indeed-style Pay/Job type. Renders only once Step 7
          adds these columns and an employer fills them in; harmless no-op today. */}
      {(job?.salary_range || job?.job_type || job?.work_mode) && (
        <div className="hairline rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Job details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
            {posted && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Posted {posted}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3">About the job</h2>
          <p className="sm:text-lg">{job?.description}</p>
        </div>

        {Array.isArray(job?.skills) && job.skills.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3">Skills required</h2>
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
          <h2 className="text-xl sm:text-2xl font-bold mb-3">What we are looking for</h2>
          <MDEditor.Markdown source={job?.requirements} className="bg-transparent sm:text-lg" data-color-mode={resolvedTheme} />
        </div>

        {/* Benefits — renders once Step 7/8 add this column */}
        {Array.isArray(job?.benefits) && job.benefits.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3">Benefits</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {job.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

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

      <Link
        to="/contact"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive w-fit"
      >
        <Flag className="h-3.5 w-3.5" /> Report job
      </Link>

      {/* Sticky apply affordance — appears once the hero (and its real Apply
          control) scrolls out of view. Scrolls back up rather than duplicating
          the apply flow's state, so there's a single source of truth for it.
          Desktop: a centered pill at the top. Mobile: a full-width bar
          pinned to the bottom, easier to reach with a thumb while scrolling. */}
      {showSticky && !isOwner && (
        <>
          <div className="hidden lg:block fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <Button
              size="lg"
              onClick={scrollToHero}
              disabled={!job?.isOpen}
              className="px-8 font-semibold hover:bg-primary shadow-[0_8px_24px_rgba(168,85,247,0.28)]"
            >
              {!job?.isOpen
                ? "Hiring Closed"
                : isSignedIn
                ? appliedApplication
                  ? "Applied"
                  : "Apply Now"
                : "Sign in to Apply"}
            </Button>
          </div>

          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 hairline border-t bg-surface/95 backdrop-blur px-4 py-3">
            <Button
              size="lg"
              onClick={scrollToHero}
              disabled={!job?.isOpen}
              className="w-full font-semibold hover:bg-primary shadow-[0_8px_24px_rgba(168,85,247,0.28)]"
            >
              {!job?.isOpen
                ? "Hiring Closed"
                : isSignedIn
                ? appliedApplication
                  ? "Applied"
                  : "Apply Now"
                : "Sign in to Apply"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default JobDetailsPage;
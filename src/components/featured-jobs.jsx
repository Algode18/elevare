import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { MapPin, Heart, ArrowRight, Clock, BadgeCheck, Briefcase } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { saveJob } from "@/api/apiJobs";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const OpportunityCard = ({ job }) => {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  const [saved, setSaved] = useState(!!job?.saved);
  const { loading: loadingSavedJob, data: savedJob, fn: fnSavedJob } = useFetch(saveJob, {
    alreadySaved: saved,
  });

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      navigate("/?sign-in=true");
      return;
    }
    await fnSavedJob({ user_id: user.id, job_id: job.id });
  };

  const isRemote = /remote/i.test(job.location || "");
  const posted = timeAgo(job.created_at);
  const isNew = job.created_at && Date.now() - new Date(job.created_at).getTime() < 72 * 3600000;
  const isVerified = job.company?.verification_status === "verified";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4 }}
      className="group hairline relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-surface/50 p-6 backdrop-blur transition-colors duration-300 hover:border-primary/40"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {job.company?.logo_url ? (
            <img src={job.company.logo_url} alt={job.company?.name} className="h-8 w-8 rounded-md object-contain" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-surface-2 text-xs font-semibold">
              {job.company?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {job.company?.name}
              {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-label="Verified company" />}
              {isNew && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                  New
                </span>
              )}
            </div>
            {posted && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {posted}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveJob}
          disabled={loadingSavedJob}
          aria-label="Save job"
          className="hairline grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:border-primary/50 disabled:opacity-50"
        >
          <Heart className={`h-4 w-4 transition-colors ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="relative">
        <h3 className="text-lg font-semibold leading-snug">{job.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location || "Location TBD"}
          </span>
          {isRemote && <span className="text-primary">Remote</span>}
          {job.job_type && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {job.job_type}
            </span>
          )}
          {job.salary_range && <span>{job.salary_range}</span>}
        </div>
      </div>

      {Array.isArray(job.skills) && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary transition-colors duration-300 group-hover:bg-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/jobs/${job.id}`}
        className="group/cta relative mt-auto inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        View Details
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
      </Link>
    </motion.div>
  );
};

const FeaturedJobs = ({ jobs, loading }) => {
  // jobs already arrive newest-first from getJobs() (see api/apiJobs.js),
  // sorting again here defensively so this stays correct even if a caller
  // ever passes an unsorted list.
  const sorted = jobs
    ? [...jobs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    : jobs;
  const latest = sorted?.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Open roles</div>
        <h2 className="mt-3 font-display text-5xl">Latest jobs.</h2>
      </div>

      {loading !== false && (
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="hairline h-64 animate-pulse rounded-2xl bg-surface/40" />
          ))}
        </div>
      )}

      {loading === false && (
        <div className="grid gap-6 md:grid-cols-3">
          {latest?.map((job) => (
            <OpportunityCard key={job.id} job={job} />
          ))}
          {latest?.length === 0 && <div className="text-muted-foreground">No open roles yet — check back soon.</div>}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/jobs"
          className="hairline inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm hover:border-border-strong"
        >
          Explore All Opportunities <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedJobs;
import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import { ArrowRight } from "lucide-react";
import JobCard from "@/components/job-card";

const FeaturedJobs = ({ jobs, loading }) => {
  const { isSignedIn } = useUser();
  // jobs already arrive newest-first from getJobs() (see api/apiJobs.js),
  // sorting again here defensively so this stays correct even if a caller
  // ever passes an unsorted list.
  const sorted = jobs
    ? [...jobs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    : jobs;
  const latest = sorted?.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-14 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Open roles</div>
        <h2 className="mt-3 font-display text-5xl">Featured Opportunities.</h2>
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
          {latest?.map((job, idx) => (
            <JobCard key={job.id} job={job} index={idx} savedInit={job.saved} />
          ))}
          {latest?.length === 0 && <div className="text-muted-foreground">No open roles yet — check back soon.</div>}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to={isSignedIn ? "/dashboard/jobs" : "/jobs"}
          className="hairline inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm hover:border-border-strong"
        >
          Explore All Opportunities <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedJobs;
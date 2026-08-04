import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, ArrowUpDown } from "lucide-react";
import { getSavedJobs, saveJob } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import SavedJobCard from "@/components/saved/saved-job-card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SORTS = [
  { value: "newest", label: "Newest saved" },
  { value: "oldest", label: "Oldest saved" },
];

// Career Wishlist, v2 — compact header (no full-viewport hero), dense
// ~180px cards, and collection chips built from whatever job_type /
// work_mode / skill values actually appear in your saved jobs (real
// counts, not a fixed taxonomy). Everything renders only if there's real
// data behind it.
const SavedJobsPage = () => {
  const { user, isLoaded } = useUser();
  const [sort, setSort] = useState("newest");
  const [activeFilter, setActiveFilter] = useState(null); // { kind, value }

  const { loading: loadingSavedJobs, data: savedJobs, fn: fnSavedJobs } = useFetch(getSavedJobs);
  const { fn: fnUnsave } = useFetch(saveJob, { alreadySaved: true });

  useEffect(() => {
    if (isLoaded) fnSavedJobs();
  }, [isLoaded]);

  const handleUnsave = async (jobId) => {
    await fnUnsave({ user_id: user.id, job_id: jobId });
    fnSavedJobs();
  };

  const jobs = useMemo(() => (savedJobs || []).filter((s) => s?.job), [savedJobs]);

  // Real, dynamic collections — job_type values, work_mode values, and
  // the top 3 skills, each with an actual count from your saved list.
  const collections = useMemo(() => {
    const counts = {};
    const bump = (kind, value) => {
      if (!value) return;
      const key = `${kind}:${value}`;
      counts[key] = counts[key] || { kind, value, count: 0 };
      counts[key].count += 1;
    };
    jobs.forEach(({ job }) => {
      bump("job_type", job.job_type);
      bump("work_mode", job.work_mode);
      (Array.isArray(job.skills) ? job.skills : []).forEach((s) => bump("skill", s));
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (activeFilter) {
      list = list.filter(({ job }) => {
        if (activeFilter.kind === "skill") return (job.skills || []).includes(activeFilter.value);
        return job[activeFilter.kind] === activeFilter.value;
      });
    }
    list = [...list];
    if (sort === "oldest") list.reverse();
    return list;
  }, [jobs, activeFilter, sort]);

  if (!isLoaded || loadingSavedJobs !== false) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[180px] skeleton rounded-[var(--radius-card)]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Compact header — title, count, sort. No full-viewport hero. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 shadow-[var(--shadow-1)]">
        <div className="flex items-center gap-2.5">
          <Heart className="h-5 w-5 fill-[#EC4899] text-[#EC4899]" />
          <div>
            <h1 className="font-display text-2xl leading-none">Career Wishlist</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {jobs.length} saved job{jobs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-border bg-surface-2 px-1">
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {jobs.length > 0 ? (
        <>
          {/* Collections — real counts, click to filter, click again to clear */}
          {collections.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {collections.map((c) => {
                const isActive = activeFilter?.kind === c.kind && activeFilter?.value === c.value;
                return (
                  <button
                    key={`${c.kind}:${c.value}`}
                    type="button"
                    onClick={() => setActiveFilter(isActive ? null : c)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {c.value} <span className="opacity-70">({c.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Dense grid — 1 col mobile, 2 cols tablet+desktop */}
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AnimatePresence>
              {filteredJobs.map(({ id, job, created_at }) => (
                <SavedJobCard key={id} job={job} savedAt={created_at} onRemoved={handleUnsave} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredJobs.length === 0 && (
            <div className="rounded-[var(--radius-card)] border border-border py-10 text-center text-sm text-muted-foreground">
              No saved jobs match that filter.
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EC4899]/10 text-[#EC4899]">
            <Bookmark className="h-5 w-5" />
          </div>
          <div className="font-medium">Your dream collection is empty.</div>
          <p className="text-sm text-muted-foreground">Start saving roles you don't want to lose track of.</p>
          <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
            Explore jobs →
          </Link>
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
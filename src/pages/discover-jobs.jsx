import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Building2,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  Inbox,
  IndianRupee,
  Laptop,
} from "lucide-react";
import { getCompanies } from "@/api/apiCompanies";
import { getJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import useProfile from "@/hooks/use-profile";
import useRecentSearches from "@/hooks/use-recent-searches";
import CitySelect from "@/components/city-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import JobMatchTile from "@/components/discover/job-match-tile";
import JobDetailsPanel from "@/components/discover/job-details-panel";
import AiDiscoverHero from "@/components/discover/ai-discover-hero";
import MarketPulse from "@/components/discover/market-pulse";
import RecentSearches from "@/components/discover/recent-searches";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODES = ["Remote", "On-site", "Hybrid"];
const SALARY_BANDS = [
  { value: "0-500000", label: "Up to ₹5L" },
  { value: "500000-1000000", label: "₹5L – 10L" },
  { value: "1000000-2000000", label: "₹10L – 20L" },
  { value: "2000000-999999999", label: "₹20L+" },
];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "salary", label: "Highest salary" },
];
const JOBS_PER_PAGE = 9;

const SCROLL_HIDE = "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

// Career Discovery Workspace — replaces the old "list on the left, details
// pinned on the right" split view. Every job is a self-contained match
// tile in a responsive grid; opening one slides a panel in from the right
// (same panel content as before — job-details-panel.jsx — just presented
// as an overlay instead of permanently occupying half the page).
const DiscoverJobsPage = () => {
  const { user } = useUser();
  const [urlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [location, setLocation] = useState(urlParams.get("location") || "");
  const [company_id, setCompany_id] = useState("");
  const [job_type, setJobType] = useState("");
  const [work_mode, setWorkMode] = useState("");
  const [salaryBand, setSalaryBand] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState(() => {
    const jobParam = urlParams.get("job");
    return jobParam ? Number(jobParam) : null;
  });
  const [detailOpen, setDetailOpen] = useState(() => !!urlParams.get("job"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const { fn: fnJobs, data: jobs, loading: loadingJobs } = useFetch(getJobs, {
    location,
    company_id,
    searchQuery,
    job_type,
    work_mode,
  });
  const { data: companies, fn: fnCompanies } = useFetch(getCompanies);
  const { savedIdSet } = useSavedJobIds();
  const { profile } = useProfile();
  const { recent: recentSearches, record: recordSearch } = useRecentSearches();

  const mySkills = useMemo(
    () => (Array.isArray(profile?.skills) ? profile.skills.map((s) => String(s).toLowerCase()) : []),
    [profile]
  );

  useEffect(() => {
    fnCompanies();
  }, []);

  useEffect(() => {
    fnJobs();
    setCurrentPage(1);
    if (searchQuery || job_type || work_mode || location) {
      recordSearch({ searchQuery, job_type, work_mode, location });
    }
  }, [location, company_id, searchQuery, job_type, work_mode]);

  const clearFilters = () => {
    setSearchQuery("");
    setCompany_id("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setSalaryBand("");
    setCurrentPage(1);
  };

  const applyRecentSearch = (filters) => {
    setSearchQuery(filters.searchQuery || "");
    setLocation(filters.location || "");
    setJobType(filters.job_type || "");
    setWorkMode(filters.work_mode || "");
  };

  const hasFilters = !!(searchQuery || company_id || location || job_type || work_mode || salaryBand);

  const visibleJobs = useMemo(() => {
    if (!jobs) return jobs;
    let list = jobs.filter((j) => !dismissedIds.has(j.id));
    if (salaryBand) {
      const [min, max] = salaryBand.split("-").map(Number);
      list = list.filter((j) => {
        const pay = Number(j.salary_max) || Number(j.salary_min) || 0;
        return pay >= min && pay <= max;
      });
    }
    return list;
  }, [jobs, dismissedIds, salaryBand]);

  const sortedJobs = useMemo(() => {
    if (!visibleJobs) return visibleJobs;
    const list = [...visibleJobs];
    if (sort === "oldest") list.reverse();
    else if (sort === "salary") list.sort((a, b) => (Number(b.salary_max) || 0) - (Number(a.salary_max) || 0));
    return list;
  }, [visibleJobs, sort]);

  const indexOfLast = currentPage * JOBS_PER_PAGE;
  const indexOfFirst = indexOfLast - JOBS_PER_PAGE;
  const currentJobs = sortedJobs?.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil((sortedJobs?.length || 0) / JOBS_PER_PAGE);

  const handleOpen = (id) => {
    setSelectedJobId(id);
    setDetailOpen(true);
  };

  const handleNotInterested = (id) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    if (id === selectedJobId) setDetailOpen(false);
  };

  // AI search bar hands back { query, job_type, work_mode } — apply
  // whichever it detected, leave anything it didn't touch alone, then
  // jump the person straight to the results instead of leaving them
  // stranded up at the hero after they've already told us what they want.
  const handleAiSearch = (parsed) => {
    setSearchQuery(parsed.query || "");
    if (parsed.job_type) setJobType(parsed.job_type);
    if (parsed.work_mode) setWorkMode(parsed.work_mode);
    document.getElementById("job-listings-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategory = (cat) => {
    setSearchQuery(cat.query || "");
  };

  const activeChips = [
    searchQuery && { key: "search", label: `"${searchQuery}"`, clear: () => setSearchQuery("") },
    location && { key: "location", label: location, clear: () => setLocation("") },
    company_id && {
      key: "company",
      label: companies?.find((c) => c.id === company_id)?.name || "Company",
      clear: () => setCompany_id(""),
    },
    job_type && { key: "job_type", label: job_type, clear: () => setJobType("") },
    work_mode && { key: "work_mode", label: work_mode, clear: () => setWorkMode("") },
    salaryBand && {
      key: "salary",
      label: SALARY_BANDS.find((b) => b.value === salaryBand)?.label || "Salary",
      clear: () => setSalaryBand(""),
    },
  ].filter(Boolean);

  const firstName = user?.firstName || user?.fullName || "there";

  return (
    <div>
      <AiDiscoverHero
        firstName={firstName}
        matchCount={loadingJobs === false ? sortedJobs?.length ?? 0 : 0}
        onAiSearch={handleAiSearch}
        onCategory={handleCategory}
      />

      {/* Market pulse — platform-wide hiring overview, skill demand,
          hiring locations, employment-type breakdown, today's snapshot, and
          recent activity. Unlike the Job Listings grid below, this is
          unfiltered: a stable snapshot of the whole market rather than the
          current search, so it belongs above the filterable list. */}
      <div className="mb-14">
        <MarketPulse onOpenJob={handleOpen} />
      </div>

      {/* Section bar — sticky label + floating filter toggle (Raycast-style
          glass panel below, not a permanent sidebar). */}
      <div
        id="job-listings-section"
        className="sticky top-0 z-20 -mx-6 mb-4 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-6 py-3 backdrop-blur-sm lg:-mx-8 lg:px-8"
      >
        <p className="text-lg font-semibold">Job Listings</p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {loadingJobs === false ? `${sortedJobs?.length ?? 0} roles found` : "Loading…"}
          </span>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`hairline flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${
              filtersOpen ? "border-primary/50 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {hasFilters && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
          <button
            type="button"
            onClick={() => fnJobs()}
            aria-label="Refresh"
            className="hairline grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loadingJobs !== false ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              <CitySelect
                value={location}
                onChange={setLocation}
                placeholder='City, state, or "remote"'
                className="hairline w-full rounded-xl bg-surface/60"
                inputClassName="h-9 border-none bg-transparent pl-8 shadow-none dark:bg-transparent"
              />

              <div className="hairline flex items-center gap-1.5 rounded-xl bg-surface/60 px-2.5">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={company_id} onValueChange={setCompany_id}>
                  <SelectTrigger className="w-full border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Any company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies?.map(({ name, id }) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="hairline flex items-center gap-1.5 rounded-xl bg-surface/60 px-2.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={job_type} onValueChange={setJobType}>
                  <SelectTrigger className="w-full border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Any job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {JOB_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="hairline flex items-center gap-1.5 rounded-xl bg-surface/60 px-2.5">
                <Laptop className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={work_mode} onValueChange={setWorkMode}>
                  <SelectTrigger className="w-full border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Any work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {WORK_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="hairline flex items-center gap-1.5 rounded-xl bg-surface/60 px-2.5">
                <IndianRupee className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={salaryBand} onValueChange={setSalaryBand}>
                  <SelectTrigger className="w-full border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Any salary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SALARY_BANDS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="hairline flex items-center gap-1.5 rounded-xl bg-surface/60 px-2.5">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Sort" />
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
            </div>

            {hasFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    className="hairline flex items-center gap-1.5 rounded-full bg-background/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {chip.label} <X className="h-3 w-3" />
                  </button>
                ))}
                <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RecentSearches items={recentSearches} onApply={applyRecentSearch} />

      {/* Match grid — every tile is a self-contained opportunity card */}
      {loadingJobs !== false ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hairline h-56 animate-pulse rounded-2xl bg-surface/60" />
          ))}
        </div>
      ) : currentJobs?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {currentJobs.map((job, i) => (
            <JobMatchTile
              key={job.id}
              job={job}
              index={i}
              onOpen={handleOpen}
              savedInit={savedIdSet.has(job.id)}
              onNotInterested={handleNotInterested}
              mySkills={mySkills}
            />
          ))}
        </div>
      ) : (
        <div className="hairline flex flex-col items-center justify-center gap-3 rounded-2xl p-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="font-medium">Your dream role isn't here yet.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-sm font-medium text-primary hover:underline">
              Reset filters →
            </button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Job detail — animated panel sliding in from the right, every
          breakpoint. Replaces the old permanent split-screen. */}
      <Drawer open={detailOpen} onOpenChange={setDetailOpen} direction="right">
        <DrawerContent className="!w-full sm:!max-w-lg lg:!max-w-xl">
          <DrawerTitle className="sr-only">Job details</DrawerTitle>
          <div className={`min-h-0 flex-1 overflow-y-auto ${SCROLL_HIDE}`}>
            {selectedJobId && (
              <JobDetailsPanel
                jobId={selectedJobId}
                onNotInterested={handleNotInterested}
                onBack={() => setDetailOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DiscoverJobsPage;
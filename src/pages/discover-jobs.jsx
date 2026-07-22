import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Briefcase,
  Building2,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  Inbox,
  MapPin,
} from "lucide-react";
import { getCompanies } from "@/api/apiCompanies";
import { getJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import CitySelect from "@/components/city-select";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import JobRowCard from "@/components/discover/job-row-card";
import JobDetailsPanel from "@/components/discover/job-details-panel";
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
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "salary", label: "Highest salary" },
];
const JOBS_PER_PAGE = 8;

// Hides the scrollbar visually on an element while leaving it scrollable —
// applied to the one place on this page that actually needs its own
// scroll (the sticky detail card / mobile drawer body).
const SCROLL_HIDE = "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

// Discover Jobs — matches indeed.com's own "Jobs for you" split view:
// the job list is a normal part of page flow (no boxed inner scroll —
// it scrolls with the page, same as the sidebar/header around it), and
// only the detail card on the right is `sticky`, capped to the viewport,
// and scrolls internally past that cap. That's one scrollbar for the
// whole page plus one (hidden) scrollbar inside the sticky card — not
// two separate boxed panels each with their own visible scroll track.
const DiscoverJobsPage = () => {
  const { user } = useUser();
  const [urlParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(urlParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [location, setLocation] = useState(urlParams.get("location") || "");
  const [company_id, setCompany_id] = useState("");
  const [job_type, setJobType] = useState("");
  const [work_mode, setWorkMode] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // "Not interested" has no backend column to persist against — this is a
  // client-side, this-session-only dismissal, same as the rest of the
  // filter/sort state on this page.
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

  useEffect(() => {
    fnCompanies();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fnJobs();
    setCurrentPage(1);
  }, [location, company_id, searchQuery, job_type, work_mode]);

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCompany_id("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setCurrentPage(1);
  };

  const hasFilters = !!(searchQuery || company_id || location || job_type || work_mode);

  const visibleJobs = useMemo(() => {
    if (!jobs) return jobs;
    return jobs.filter((j) => !dismissedIds.has(j.id));
  }, [jobs, dismissedIds]);

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

  useEffect(() => {
    if (!currentJobs?.length) {
      setSelectedJobId(null);
      return;
    }
    if (!currentJobs.some((j) => j.id === selectedJobId)) {
      setSelectedJobId(currentJobs[0].id);
    }
  }, [currentJobs]);

  const handleSelect = (id) => {
    setSelectedJobId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) setMobileDetailOpen(true);
  };

  const handleNotInterested = (id) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    if (id === selectedJobId) setSelectedJobId(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!currentJobs?.length) return;
      const idx = currentJobs.findIndex((j) => j.id === selectedJobId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentJobs[Math.min(idx + 1, currentJobs.length - 1)];
        if (next) handleSelect(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentJobs[Math.max(idx - 1, 0)];
        if (prev) handleSelect(prev.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentJobs, selectedJobId]);

  const activeChips = [
    searchQuery && { key: "search", label: `"${searchQuery}"`, clear: () => { setSearchInput(""); setSearchQuery(""); } },
    location && { key: "location", label: location, clear: () => setLocation("") },
    company_id && {
      key: "company",
      label: companies?.find((c) => c.id === company_id)?.name || "Company",
      clear: () => setCompany_id(""),
    },
    job_type && { key: "job_type", label: job_type, clear: () => setJobType("") },
    work_mode && { key: "work_mode", label: work_mode, clear: () => setWorkMode("") },
  ].filter(Boolean);

  const firstName = user?.firstName || user?.fullName || "there";

  return (
    <div>
      {/* Search pill — job title/keywords | location | Find jobs */}
      <div className="mb-6">
        <div className="flex h-16 items-center overflow-hidden rounded-full bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="flex h-full flex-1 items-center gap-2.5 pl-5 pr-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="h-full rounded-none border-none bg-transparent px-0 text-[15px] shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div className="h-6 w-px shrink-0 bg-white/10" />
          <div className="flex h-full flex-[0.8] items-center gap-2.5 pl-4 pr-2">
            <CitySelect
              value={location}
              onChange={setLocation}
              placeholder='City, state, zip code, or "remote"'
              icon={MapPin}
              className="w-full"
              inputClassName="rounded-none dark:bg-transparent focus-visible:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={() => fnJobs()}
            className="my-2 mr-2 shrink-0 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Find jobs
          </button>
        </div>
      </div>

      <h1 className="mb-4 font-display text-3xl leading-tight">Welcome, {firstName}</h1>

      {/* This bar pins to the top of the page once you scroll down to it —
          same as Indeed's "Jobs for you" label staying put while the list
          scrolls underneath. The sticky detail card below is offset to
          start right under this bar (see `top-14` further down) so the
          two line up instead of the card overlapping the label. */}
      <div className="sticky top-0 z-20 -mx-6 mb-4 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-6 py-3 backdrop-blur-sm lg:-mx-8 lg:px-8">
        <p className="text-lg font-semibold">Jobs for you</p>
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
            <div className="hairline grid grid-cols-2 gap-2 rounded-xl bg-surface/60 p-3 sm:grid-cols-3 lg:grid-cols-4">
              <div className="hairline flex items-center gap-2 rounded-lg bg-background/40 px-1">
                <Building2 className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={company_id} onValueChange={setCompany_id}>
                  <SelectTrigger className="border-none bg-transparent">
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

              <div className="hairline flex items-center gap-2 rounded-lg bg-background/40 px-1">
                <Briefcase className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={job_type} onValueChange={setJobType}>
                  <SelectTrigger className="border-none bg-transparent">
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

              <div className="hairline flex items-center gap-2 rounded-lg bg-background/40 px-1">
                <Select value={work_mode} onValueChange={setWorkMode}>
                  <SelectTrigger className="border-none bg-transparent">
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

              <div className="hairline flex items-center gap-2 rounded-lg bg-background/40 px-1">
                <ArrowUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="border-none bg-transparent">
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

      {/* Split view — left list is plain page flow, right card is sticky */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        {/* List */}
        <div>
          {loadingJobs !== false ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-surface/60 p-4">
                  <div className="space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-surface-2" />
                    <div className="h-3 w-1/2 rounded bg-surface-2" />
                    <div className="h-3 w-1/3 rounded bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentJobs?.length ? (
            <div className="flex flex-col gap-2.5">
              {currentJobs.map((job) => (
                <JobRowCard
                  key={job.id}
                  job={job}
                  isSelected={job.id === selectedJobId}
                  onSelect={handleSelect}
                  savedInit={savedIdSet.has(job.id)}
                  onNotInterested={handleNotInterested}
                />
              ))}
            </div>
          ) : (
            <div className="hairline flex flex-col items-center justify-center gap-3 rounded-2xl p-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">No jobs match your filters.</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="text-sm font-medium text-primary hover:underline">
                  Reset filters →
                </button>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-3">
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
        </div>

        {/* Detail card — desktop only; sticky, capped to the viewport, and
            the ONLY element on this page with its own scroll (hidden). */}
        <div className="hidden lg:block">
          {selectedJobId ? (
            <div
              className={`sticky top-14 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border bg-surface shadow-sm ${SCROLL_HIDE}`}
            >
              <JobDetailsPanel jobId={selectedJobId} onNotInterested={handleNotInterested} />
            </div>
          ) : (
            <div className="hairline sticky top-14 flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl text-center text-muted-foreground">
              <Briefcase className="h-6 w-6" />
              <p className="text-sm">Select a role to see the details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail drawer */}
      <Drawer open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <DrawerContent className="h-[88vh] flex-col">
          <DrawerTitle className="sr-only">Job details</DrawerTitle>
          <div className={`min-h-0 flex-1 overflow-y-auto ${SCROLL_HIDE}`}>
            {selectedJobId && <JobDetailsPanel jobId={selectedJobId} onNotInterested={handleNotInterested} />}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DiscoverJobsPage;
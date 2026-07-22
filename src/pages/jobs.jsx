import { getCompanies } from "@/api/apiCompanies";
import { getJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import CitySelect from "@/components/city-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import usePublicFetch from "@/hooks/use-public-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Search, X, Briefcase, Building2, ArrowUpDown } from "lucide-react";
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

// Public job board — no auth required to browse, search, or filter.
// Saving/applying still requires sign-in (handled inside JobCard / job details).
const JobsPage = () => {
  const [urlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [location, setLocation] = useState(urlParams.get("location") || "");
  const [company_id, setCompany_id] = useState("");
  const [job_type, setJobType] = useState("");
  const [work_mode, setWorkMode] = useState("");
  const [sort, setSort] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;

  const {
    fn: fnJobs,
    data: jobs,
    loading: loadingJobs,
  } = usePublicFetch(getJobs, {
    location,
    company_id,
    searchQuery,
    job_type,
    work_mode,
  });

  const { data: companies, fn: fnCompanies } = usePublicFetch(getCompanies);
  const { savedIdSet } = useSavedJobIds();

  useEffect(() => {
    fnCompanies();
  }, []);

  useEffect(() => {
    fnJobs();
    setCurrentPage(1);
  }, [location, company_id, searchQuery, job_type, work_mode]);

  const handleSearch = (e) => {
    e.preventDefault();
    let formData = new FormData(e.target);
    const query = formData.get("search-query");
    setSearchQuery(query || "");
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCompany_id("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setCurrentPage(1);
  };

  const hasFilters = !!(searchQuery || company_id || location || job_type || work_mode);

  // Sorting happens client-side over the already-fetched, already-filtered
  // list — getJobs() returns newest-first from the API, so "newest" needs
  // no extra work; "oldest" reverses it, "salary" ranks by salary_max
  // (the real numeric column — salary_range is just its display string).
  const sortedJobs = useMemo(() => {
    if (!jobs) return jobs;
    const list = [...jobs];
    if (sort === "oldest") {
      list.reverse();
    } else if (sort === "salary") {
      list.sort((a, b) => (Number(b.salary_max) || 0) - (Number(a.salary_max) || 0));
    }
    return list;
  }, [jobs, sort]);

  const indexOfLast = currentPage * jobsPerPage;
  const indexOfFirst = indexOfLast - jobsPerPage;
  const currentJobs = sortedJobs?.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil((sortedJobs?.length || 0) / jobsPerPage);

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
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Live
        </div>
        <h1 className="font-display text-5xl">Find your next role</h1>
        <p className="mt-3 text-muted-foreground">
          {loadingJobs === false ? `${jobs?.length ?? 0} open roles` : "Loading roles…"} on Elevare right now
        </p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mb-4 flex w-full max-w-3xl gap-2">
        <div className="hairline relative flex-1 rounded-lg bg-surface">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Job title, skill, or company..."
            name="search-query"
            defaultValue={searchQuery}
            className="h-11 border-none bg-transparent pl-9 text-sm"
          />
        </div>
        <Button type="submit" size="lg" className="h-11">
          Search
        </Button>
      </form>

      <div className="mx-auto mb-4 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="hairline rounded-lg bg-surface">
          <CitySelect value={location} onChange={setLocation} placeholder="Any location" />
        </div>

        <div className="hairline flex items-center gap-2 rounded-lg bg-surface px-1">
          <Building2 className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Select value={company_id} onValueChange={(value) => setCompany_id(value)}>
            <SelectTrigger className="border-none bg-transparent">
              <SelectValue placeholder="Any company" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {companies?.map(({ name, id }) => (
                  <SelectItem key={name} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="hairline flex items-center gap-2 rounded-lg bg-surface px-1">
          <Briefcase className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Select value={job_type} onValueChange={(value) => setJobType(value)}>
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

        <div className="hairline flex items-center gap-2 rounded-lg bg-surface px-1">
          <Select value={work_mode} onValueChange={(value) => setWorkMode(value)}>
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

        <div className="hairline flex items-center gap-2 rounded-lg bg-surface px-1">
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
        <div className="mx-auto mb-10 flex max-w-4xl flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {chip.label} <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {loadingJobs !== false && (
        <BarLoader className="mt-4" width={"100%"} color="#7c5cff" />
      )}

      {loadingJobs === false && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentJobs?.length ? (
            currentJobs.map((job) => (
              <JobCard key={job.id} job={job} savedInit={savedIdSet.has(job.id)} />
            ))
          ) : (
            <div className="hairline col-span-full flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">
                No jobs match {hasFilters ? "these filters" : "your search"}.
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm font-medium text-primary hover:underline">
                  Clear filters →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-10">
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
      )}
    </div>
  );
};

export default JobsPage;
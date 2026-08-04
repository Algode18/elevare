import { getCompanies } from "@/api/apiCompanies";
import usePublicFetch from "@/hooks/use-public-fetch";
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Flame,
  MapPin,
  Search,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CompanyCard from "@/components/companies/company-card";
import FeaturedCompanyCard from "@/components/companies/featured-company-card";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const CompaniesPage = () => {
  const { data: companies, loading, fn } = usePublicFetch(getCompanies);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const search = params.get("search") || "";
  const gridRef = useRef(null);

  const { user, isSignedIn } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
  const isCandidate = isSignedIn && !isRecruiter;

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [hiring, setHiring] = useState("");

  useEffect(() => {
    fn();
  }, []);

  // Companies can have the same industry typed with different casing or
  // stray whitespace (e.g. "IT Services & Consulting" vs "IT services &
  // consulting "), which used to show up as separate chips even though
  // they're the same industry. Group by a normalized key and keep the
  // first-seen original casing for display.
  const normalizeIndustry = (value) => value?.trim().replace(/\s+/g, " ");
  const normalizeLocation = (value) => value?.trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ");

  const industries = useMemo(() => {
    const byKey = new Map();
    (companies || []).forEach((c) => {
      const label = normalizeIndustry(c.industry);
      if (!label) return;
      const key = label.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, label);
    });
    return [...byKey.values()].sort();
  }, [companies]);

  const locations = useMemo(() => {
    const byKey = new Map();
    (companies || []).forEach((c) => {
      const label = normalizeLocation(c.headquarters);
      if (!label) return;
      const key = label.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, label);
    });
    return [...byKey.values()].sort();
  }, [companies]);

  const industryCounts = useMemo(() => {
    const counts = new Map();
    const labels = new Map();
    (companies || []).forEach((c) => {
      const label = normalizeIndustry(c.industry);
      if (!label) return;
      const key = label.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!labels.has(key)) labels.set(key, label);
    });
    return [...counts.entries()]
      .map(([key, count]) => ({ name: labels.get(key), count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  const filtered = useMemo(() => {
    if (!companies) return companies;
    let list = companies;

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(needle));
    }
    if (industry) {
      const key = industry.toLowerCase();
      list = list.filter((c) => normalizeIndustry(c.industry)?.toLowerCase() === key);
    }
    if (location) {
      const key = location.toLowerCase();
      list = list.filter((c) => normalizeLocation(c.headquarters)?.toLowerCase() === key);
    }
    if (size) list = list.filter((c) => c.company_size === size);
    if (hiring) list = list.filter((c) => ((c.open_roles || 0) > 0) === (hiring === "hiring"));

    return list;
  }, [companies, search, industry, location, size, hiring]);

  useEffect(() => {
    if (search.trim() && filtered?.length === 1) {
      navigate(`/companies/${filtered[0].id}`, { replace: true });
    }
  }, [filtered, search]);

  const totalOpenRoles = companies?.reduce((sum, c) => sum + (c.open_roles || 0), 0) ?? 0;
  const hiringCount = companies?.filter((c) => (c.open_roles || 0) > 0).length ?? 0;

  const featured = useMemo(() => {
    if (!companies) return [];
    const sorted = [...companies].sort((a, b) => (b.open_roles || 0) - (a.open_roles || 0));
    return sorted.slice(0, 3);
  }, [companies]);

  const hiringNow = useMemo(() => {
    if (!companies) return [];
    const featuredIds = new Set(featured.map((c) => c.id));
    return [...companies]
      .filter((c) => (c.open_roles || 0) > 0 && !featuredIds.has(c.id))
      .sort((a, b) => (b.open_roles || 0) - (a.open_roles || 0))
      .slice(0, 6);
  }, [companies, featured]);

  const hasFilters = !!(search || industry || location || size || hiring);
  const clearFilters = () => {
    setParams({});
    setIndustry("");
    setLocation("");
    setSize("");
    setHiring("");
  };

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Asymmetric split hero — left-aligned copy + search, right-side
          offset stat cards. Deliberately NOT the centered-badge/huge-serif
          pattern the Landing hero uses, so the two pages read as distinct
          products rather than the same template with swapped text. */}
      <section className="relative overflow-hidden border-b border-border/60 bg-surface/20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 grid-bg opacity-[0.08] [mask-image:linear-gradient(to_left,black,transparent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 sm:px-8 md:py-16">
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-10">
            {/* Left: copy + search + chips, left-aligned (not centered) */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-center gap-2 text-center text-xs font-mono uppercase tracking-widest text-primary sm:justify-start sm:text-left">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Company Directory
              </div>
              <h1 className="mt-4 text-center sm:text-left">
                <span className="block font-display text-[28px] leading-[1.15] sm:hidden">
                  Find Companies
                </span>
                <span className="hidden font-display text-4xl leading-[1.15] sm:block sm:max-w-[420px] md:max-w-[520px] md:text-5xl md:leading-[1.1]">
                  Find companies
                  <br className="hidden sm:block" /> you&apos;ll love working for.
                </span>
              </h1>
              {/* Short mobile-only description — full description restored at md+ */}
              <p className="mt-3 text-center text-[15px] leading-snug text-muted-foreground opacity-90 sm:hidden">
                Discover verified companies hiring now.
              </p>
              <p className="mt-3 hidden max-w-md text-muted-foreground opacity-80 md:block">
                Search, filter, and explore employers actively hiring on Elevare —
                see their roles, culture, and stack before you apply.
              </p>

              <div className="mt-6 relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setParams(e.target.value ? { search: e.target.value } : {})}
                  placeholder="Search companies..."
                  className="h-12 pl-9 pr-9 md:h-11"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setParams({})}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {industries.slice(0, 8).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndustry(industry === i ? "" : i)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:py-1.5",
                      industry === i
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Right: offset floating stat cards — replaces the inline
                centered stats row, gives the hero its own visual identity */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block"
            >
              <div className="flex flex-col items-end gap-3">
                <div className="rounded-[var(--radius-card)] border border-border mr-2 flex w-fit items-center gap-3 bg-surface/80 p-4 shadow-[var(--shadow-2)] backdrop-blur">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-display text-xl leading-none">{companies?.length ?? "–"}</div>
                    <div className="text-xs text-muted-foreground">Companies</div>
                  </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-border mr-12 flex w-fit items-center gap-3 bg-surface/80 p-4 shadow-[var(--shadow-2)] backdrop-blur">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan">
                    <Flame className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-display text-xl leading-none">{totalOpenRoles}</div>
                    <div className="text-xs text-muted-foreground">Open Positions</div>
                  </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-border flex w-fit items-center gap-3 bg-surface/80 p-4 shadow-[var(--shadow-2)] backdrop-blur">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-display text-xl leading-none">{hiringCount}</div>
                    <div className="text-xs text-muted-foreground">Hiring now</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Compact 3-column stats for mobile, where the offset cards are hidden */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 text-center md:hidden">
              <div className="flex flex-col items-center gap-0.5 px-1">
                <span className="font-display text-lg leading-none">{companies?.length ?? "–"}</span>
                <span className="text-[11px] text-muted-foreground">Companies</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1">
                <span className="font-display text-lg leading-none">{totalOpenRoles}</span>
                <span className="text-[11px] text-muted-foreground">Jobs</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1">
                <span className="font-display text-lg leading-none">{hiringCount}</span>
                <span className="text-[11px] text-muted-foreground">Hiring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pt-6 pb-14 sm:px-8 md:pt-14">
        {loading === false && featured.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Featured Companies
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c, i) => (
                <FeaturedCompanyCard key={c.id} company={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {loading === false && hiringNow.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              Hiring Right Now
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hiringNow.map((c) => (
                <Link
                  key={c.id}
                  to={`/companies/${c.id}`}
                  className="hairline hover-lift group flex items-center gap-3 rounded-xl bg-surface/60 p-3.5"
                >
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt={c.name}
                      className="h-10 w-10 shrink-0 rounded-lg bg-surface-2 object-contain p-1"
                    />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-cyan text-primary-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover:text-primary">{c.name}</div>
                    <div className="text-xs text-primary">
                      {c.open_roles} role{c.open_roles === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading === false && industryCounts.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Browse by Industry
            </div>
            <div className="flex flex-wrap gap-3">
              {industryCounts.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setIndustry(name);
                    scrollToGrid();
                  }}
                  className={cn(
                    "hairline hover-lift flex items-center gap-2 rounded-xl bg-surface/60 px-4 py-3 text-left transition-colors",
                    industry === name && "border-primary bg-primary/10"
                  )}
                >
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={gridRef} className="scroll-mt-24">
          <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Browse All Companies
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2.5">
            <div className="hairline flex min-w-0 items-center gap-1.5 rounded-xl bg-surface/60 px-3 py-2.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-full min-w-0 gap-1 border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {locations.length ? (
                      locations.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none__" disabled>
                        No locations added yet
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="hairline flex min-w-0 items-center gap-1.5 rounded-xl bg-surface/60 px-3 py-2.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="w-full min-w-0 gap-1 border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COMPANY_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} employees
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="hairline flex min-w-0 items-center gap-1.5 rounded-xl bg-surface/60 px-3 py-2.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select value={hiring} onValueChange={setHiring}>
                <SelectTrigger className="w-full min-w-0 gap-1 border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="hiring">Hiring now</SelectItem>
                    <SelectItem value="not-hiring">Not hiring</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasFilters && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {search && (
                <button
                  type="button"
                  onClick={() => setParams({})}
                  className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  &quot;{search}&quot; <X className="h-3 w-3" />
                </button>
              )}
              {industry && (
                <button
                  type="button"
                  onClick={() => setIndustry("")}
                  className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {industry} <X className="h-3 w-3" />
                </button>
              )}
              {location && (
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {location} <X className="h-3 w-3" />
                </button>
              )}
              {size && (
                <button
                  type="button"
                  onClick={() => setSize("")}
                  className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {size} employees <X className="h-3 w-3" />
                </button>
              )}
              {hiring && (
                <button
                  type="button"
                  onClick={() => setHiring("")}
                  className="hairline flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {hiring === "hiring" ? "Hiring now" : "Not hiring"} <X className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {loading !== false && <BarLoader className="mt-4" width={"100%"} color="var(--primary)" />}

          {loading === false && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered?.length ? (
                filtered.map((c) => <CompanyCard key={c.id} company={c} />)
              ) : (
                <div className="hairline col-span-full flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    No companies match {hasFilters ? "these filters" : `"${search}"`}.
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
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/25 via-surface to-cyan/15 p-12 text-center sm:p-16">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            {isCandidate ? (
              <>
                <h2 className="mx-auto max-w-xl font-display text-4xl sm:text-5xl">
                  Didn&apos;t find your dream company?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  Browse every open job on Elevare — new roles are added every day.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8 sm:gap-3">
                  <Link
                    to="/dashboard/jobs"
                    className="group inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                  >
                    Explore Jobs{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="mx-auto max-w-xl font-display text-4xl sm:text-5xl">
                  Don&apos;t see your company here?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  List your company on Elevare and start reaching talented candidates today.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8 sm:gap-3">
                  <Link
                    to="/employer/post-job"
                    className="group inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                  >
                    For Employers{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                  </Link>
                  <Link
                    to="/jobs"
                    className="hairline inline-flex items-center gap-1.5 rounded-md bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur hover:border-border-strong sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                  >
                    Browse All Jobs
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompaniesPage;
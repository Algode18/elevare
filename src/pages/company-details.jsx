import { getCompanies, getCompanyById, getCompanyFollowStatus, getCompanyOffices, followCompany, incrementCompanyProfileView } from "@/api/apiCompanies";
import { getJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import usePublicFetch from "@/hooks/use-public-fetch";
import useFetch from "@/hooks/use-fetch";
import useSavedJobIds from "@/hooks/use-saved-job-ids";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { BarLoader } from "react-spinners";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  Heart,
  MapPin,
  MessagesSquare,
  Send,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import CompanyCard from "@/components/companies/company-card";

const IconLinkedin = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.1 1 2.48 1s2.5 1.12 2.5 2.5zM.24 8.25h4.48V23H.24V8.25zM8.24 8.25h4.29v2.01h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.37 2.99 5.37 6.87V23h-4.48v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V23H8.24V8.25z" />
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.6 10.2 21 1.75h-1.76l-6.42 7.33-5.13-7.33H1.5l7.76 11.1L1.5 21.5h1.76l6.78-7.74 5.42 7.74h6.19l-8.05-11.3Zm-2.4 2.74-.79-1.1L3.9 3.02h2.7l5.03 7.19.78 1.1 6.54 9.35h-2.7l-5.33-7.62Z" />
  </svg>
);
const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const IconYoutube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" />
  </svg>
);

const SOCIAL_LINKS = [
  { key: "linkedin", icon: IconLinkedin, label: "LinkedIn" },
  { key: "twitter", icon: IconX, label: "X" },
  { key: "instagram", icon: IconInstagram, label: "Instagram" },
  { key: "youtube", icon: IconYoutube, label: "YouTube" },
];

// Generic, platform-level hiring flow — describes how applying through
// Elevare typically works, not a specific claim about this employer's
// internal process (no such data exists on the company record).
const HIRING_STEPS = [
  { icon: Send, title: "Apply", desc: "Submit your profile and resume in a couple of clicks." },
  { icon: FileText, title: "Resume Review", desc: "The hiring team reviews your application." },
  { icon: MessagesSquare, title: "Interviews", desc: "One or more conversations with the team." },
  { icon: Trophy, title: "Offer", desc: "Get an offer and finalize the details." },
];

const QuickFact = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="hairline flex items-center gap-3 rounded-xl bg-surface/60 p-4">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <div className="font-display text-2xl leading-none">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

// Hero-banner treatment — deliberately different from the card-grid pattern
// used on companies.jsx / saved.jsx, since this page is a single-entity
// profile designed to feel like a polished landing page.
const CompanyDetailsPage = () => {
  const { id } = useParams();
  const { user, isSignedIn } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
  // Signed-in candidates only care about finding jobs — "Explore More Companies"
  // is a lower-priority action for them, so keep the CTA to just one button.
  const isCandidate = isSignedIn && !isRecruiter;
  const [following, setFollowing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");

  // Reset page-local UI state when navigating from one company straight to
  // another (e.g. via "Similar companies") without an intermediate unmount.
  // Adjusted during render per React's guidance, rather than in an effect,
  // to avoid an extra cascading render.
  const [trackedId, setTrackedId] = useState(id);
  if (id !== trackedId) {
    setTrackedId(id);
    setFollowing(false);
    setRoleFilter("");
  }

  // Does the signed-in candidate already follow this company? Only fetched
  // for candidates — guests and recruiters never see the button at all.
  const { data: followStatus, fn: fnFollowStatus } = useFetch(getCompanyFollowStatus, {
    company_id: id,
    candidate_id: user?.id,
  });

  useEffect(() => {
    if (isCandidate && id) fnFollowStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCandidate, id, user?.id]);

  useEffect(() => {
    if (followStatus !== undefined) setFollowing(!!followStatus);
  }, [followStatus]);

  const {
    loading: loadingFollow,
    data: followResult,
    fn: fnFollow,
  } = useFetch(followCompany, { alreadyFollowing: following });

  useEffect(() => {
    // Mirrors saveJob's convention: the insert branch calls .select() (so a
    // successful follow returns a non-empty array) while the delete branch
    // doesn't (so a successful unfollow returns null/empty) — the returned
    // data itself tells us the new state.
    if (followResult !== undefined) setFollowing(followResult?.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followResult]);

  const handleToggleFollow = () => {
    if (!isCandidate || loadingFollow) return;
    fnFollow({ company_id: id, candidate_id: user.id });
  };

  const { data: company, loading: loadingCompany, fn: fnCompany } = usePublicFetch(getCompanyById, {
    company_id: id,
  });

  const { data: jobs, loading: loadingJobs, fn: fnJobs } = usePublicFetch(getJobs, {
    company_id: id,
  });

  const { data: offices, fn: fnOffices } = usePublicFetch(getCompanyOffices, {
    company_id: id,
  });

  const { data: allCompanies, fn: fnAllCompanies } = usePublicFetch(getCompanies);

  const { savedIdSet } = useSavedJobIds();

  useEffect(() => {
    fnCompany();
    fnJobs();
    fnOffices();
    fnAllCompanies();
    if (id) incrementCompanyProfileView(id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const jobTypes = useMemo(
    () => [...new Set((jobs || []).map((j) => j.job_type).filter(Boolean))],
    [jobs]
  );
  const visibleJobs = useMemo(() => {
    if (!jobs) return jobs;
    return roleFilter ? jobs.filter((j) => j.job_type === roleFilter) : jobs;
  }, [jobs, roleFilter]);

  const similarCompanies = useMemo(() => {
    if (!allCompanies || !company) return [];
    const rest = allCompanies.filter((c) => c.id !== company.id);
    const sameIndustry = rest.filter((c) => company.industry && c.industry === company.industry);
    const pool = sameIndustry.length >= 3 ? sameIndustry : rest;
    return pool.slice(0, 3);
  }, [allCompanies, company]);

  if (loadingCompany !== false) {
    return <BarLoader className="mx-6 mt-8" width={"95%"} color="var(--primary)" />;
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Company not found</h1>
        <Link to="/companies" className="mt-4 inline-block text-primary underline">
          Back to companies
        </Link>
      </div>
    );
  }

  const openCount = jobs?.filter((j) => j.isOpen).length ?? 0;
  const remoteCount = jobs?.filter((j) => j.work_mode === "Remote").length ?? 0;
  const activeSocials = SOCIAL_LINKS.filter((s) => company[s.key]);
  const hasAbout = company.about || company.mission || company.vision;
  const isVerified = company.verification_status === "verified";
  const hiringSince = company.founded_year ? `Hiring since ${company.founded_year}` : null;

  return (
    <div>
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border/60">
        {company.banner_url ? (
          <>
            <img
              src={company.banner_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/70" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 mesh-bg opacity-60" />
            <div className="absolute inset-0 grid-bg opacity-20" />
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground sm:mb-8">
            <Link to="/companies" className="hover:text-foreground">Companies</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{company.name}</span>
          </nav>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-14 w-14 shrink-0 rounded-xl bg-surface-2 object-contain p-2 sm:h-20 sm:w-20 sm:rounded-2xl sm:p-3"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan sm:h-20 sm:w-20 sm:rounded-2xl">
                  <Building2 className="h-6 w-6 text-primary-foreground sm:h-8 sm:w-8" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl sm:text-5xl">{company.name}</h1>
                  {isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-cyan sm:h-6 sm:w-6" aria-label="Verified company" />}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground sm:mt-3 sm:gap-x-5">
                  {company.industry && (
                    <span className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      {company.industry}
                    </span>
                  )}
                  {company.headquarters && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.headquarters}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {company.company_size} Employees
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {openCount} open role{openCount === 1 ? "" : "s"}
                  </span>
                </div>

                {activeSocials.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    {activeSocials.map((s) => (
                      <a
                        key={s.key}
                        href={company[s.key]}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={s.label}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                      >
                        <s.icon className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isCandidate && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={loadingFollow}
                aria-pressed={following}
                className={`hairline flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur transition-colors disabled:opacity-60 ${
                  following ? "bg-primary text-primary-foreground" : "bg-surface/60 hover:border-border-strong"
                }`}
              >
                <Heart className={following ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                {following ? "Following" : "Follow Company"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Company overview */}
        <div className="mb-14 grid gap-8 md:grid-cols-3">
          {hasAbout && (
            <div className="md:col-span-2">
              {company.about && (
                <>
                  <h2 className="mb-3 font-display text-2xl">About {company.name}</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {company.about}
                  </p>
                </>
              )}
              {(company.mission || company.vision) && (
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {company.mission && (
                    <div>
                      <h3 className="mb-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Mission
                      </h3>
                      <p className="text-sm leading-relaxed">{company.mission}</p>
                    </div>
                  )}
                  {company.vision && (
                    <div>
                      <h3 className="mb-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Vision
                      </h3>
                      <p className="text-sm leading-relaxed">{company.vision}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick facts — always shown; falls back to just hiring status
              when a company hasn't filled in the rest of its profile yet. */}
          <div className={`hairline h-fit space-y-5 rounded-2xl bg-surface/60 p-6 ${hasAbout ? "" : "md:col-span-3"}`}>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Quick Facts
            </div>
            <QuickFact icon={Calendar} label="Founded" value={company.founded_year} />
            <QuickFact icon={MapPin} label="Headquarters" value={company.headquarters} />
            <QuickFact icon={Building} label="Industry" value={company.industry} />
            <QuickFact icon={Users} label="Employees" value={company.company_size} />
            <QuickFact
              icon={Globe}
              label="Website"
              value={company.website ? company.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null}
            />
            <QuickFact icon={Briefcase} label="Hiring status" value={openCount > 0 ? "Actively hiring" : "Not hiring right now"} />
          </div>
        </div>

        {/* Hiring insights */}
        <div className="mb-14">
          <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Hiring Insights
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-4">
            <StatCard icon={Briefcase} value={openCount} label={`Open role${openCount === 1 ? "" : "s"}`} />
            <StatCard icon={Compass} value={remoteCount} label="Remote positions" />
            <StatCard icon={MapPin} value={offices?.length ?? 0} label="Office locations" />
            <StatCard icon={Sparkles} value={hiringSince ? company.founded_year : "—"} label="Hiring since" />
          </div>
        </div>

        {/* Offices */}
        {offices?.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Office locations
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offices.map((o) => (
                <div key={o.id} className="hairline flex items-start gap-3 rounded-xl bg-surface/60 p-4">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {o.city}
                      {o.is_headquarter && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          HQ
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[o.country, o.timezone].filter(Boolean).join(" • ") || "—"}
                      {o.employees ? ` • ${o.employees} employees` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why work here — only shown once a company has actually filled
            this in; no generic claims are invented for companies that
            haven't provided this yet. */}
        {company.benefits?.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Why Work Here
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {company.benefits.map((b, i) => (
                <div key={i} className="hairline flex items-center gap-3 rounded-xl bg-surface/60 p-4">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech stack — same rule as Benefits above. */}
        {company.tech_stack?.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Tech Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {company.tech_stack.map((t, i) => (
                <span key={i} className="hairline rounded-full bg-surface/60 px-3.5 py-1.5 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Open roles */}
        <div className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Open roles at {company.name}
            </div>
            {jobTypes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRoleFilter("")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    roleFilter === "" ? "bg-primary text-primary-foreground" : "hairline bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {jobTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRoleFilter(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      roleFilter === t ? "bg-primary text-primary-foreground" : "hairline bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          {loadingJobs !== false && <BarLoader width={"100%"} color="var(--primary)" />}
          {loadingJobs === false && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleJobs?.length ? (
                visibleJobs.map((job) => (
                  <JobCard key={job.id} job={job} savedInit={savedIdSet.has(job.id)} />
                ))
              ) : (
                <div className="hairline col-span-full rounded-2xl bg-surface p-12 text-center text-sm text-muted-foreground">
                  No open roles at {company.name} right now.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hiring process — generic, platform-level flow */}
        <div className="mb-14">
          <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            How Hiring Works
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {HIRING_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="hairline relative rounded-xl bg-surface/60 p-3.5 sm:p-5"
              >
                {/* Mobile — compact row: icon (with step number badge) beside title/description */}
                <div className="flex items-center gap-3 sm:hidden">
                  <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                    <span className="hairline absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-surface text-[9px] font-mono text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.desc}</div>
                  </div>
                </div>

                {/* Desktop/tablet — original vertical card, unchanged */}
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    0{i + 1}
                  </div>
                  <div className="mt-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div className="mt-3 text-sm font-semibold">{step.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{step.desc}</div>
                </div>

                {i < HIRING_STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/40 lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Similar companies */}
        {similarCompanies.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              You may also like
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarCompanies.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/25 via-surface to-cyan/15 p-10 text-center sm:p-14">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-lg font-display text-3xl sm:text-4xl">
              Didn&apos;t find the right role?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Browse every open position on Elevare, or follow {company.name} to get notified
              when they post something new.
            </p>
            <div className="mt-7 flex items-center justify-center gap-2 sm:gap-3">
              <Link
                to={isCandidate ? "/dashboard/jobs" : "/jobs"}
                className="group inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
              >
                Browse All Jobs{" "}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
              </Link>
              {!isCandidate && (
                <Link
                  to="/companies"
                  className="hairline inline-flex items-center gap-1.5 rounded-md bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur hover:border-border-strong sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                >
                  Explore More Companies
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsPage;
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import { ArrowRight, Rocket, Quote, MapPin } from "lucide-react";
import faqs from "../data/faq.json";
import { getJobs } from "@/api/apiJobs";
import usePublicFetch from "@/hooks/use-public-fetch";
import { MatchRing, Chip } from "@/components/elevare-primitives";
import SmartSearch from "@/components/smart-search";
import FeaturesBento from "@/components/features-bento";
import CareerJourney from "@/components/career-journey";
import FeaturedJobs from "@/components/featured-jobs";
import CareerInsights from "@/components/career-insights";
import useSavedJobIds from "@/hooks/use-saved-job-ids";

const testimonials = [
  {
    quote: "The application tracker means I always know exactly where I stand — no more wondering if a recruiter even saw my resume.",
    name: "Ananya R.",
    role: "Senior Engineer",
    side: "Candidate",
  },
  {
    quote: "We finally have a real pipeline instead of a spreadsheet of resumes. Posting a role and reviewing applicants takes minutes now.",
    name: "Rahul M.",
    role: "Recruiting Lead",
    side: "Employer",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="text-base font-medium">{q}</span>
        <span className="text-xl text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-3 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";

  const { data: jobs, loading: loadingJobs, fn: fnJobs } = usePublicFetch(getJobs, {});
  const { savedIdSet } = useSavedJobIds();

  useEffect(() => {
    fnJobs();
  }, []);

  // Employers don't get a marketing landing page — they land straight in
  // their dashboard, same pattern as onboarding.jsx uses post-role-selection.
  useEffect(() => {
    if (isLoaded && isSignedIn && isRecruiter) {
      navigate("/employer/dashboard", { replace: true });
    }
  }, [isLoaded, isSignedIn, isRecruiter, navigate]);

  const jobsWithSaved = jobs?.map((job) => ({ ...job, saved: savedIdSet.has(job.id) }));

  // Avoid flashing the marketing page for a signed-in employer while Clerk
  // is still resolving the role, or during the moment before the redirect
  // above actually navigates away.
  if (!isLoaded || (isSignedIn && isRecruiter)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <BarLoader width={"100%"} color="var(--primary)" />
      </div>
    );
  }

  return (
    <>
      {/* 1. HERO — headline + subheading only */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10 md:pt-28 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs backdrop-blur">
              <Rocket className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Built for Modern Hiring</span>
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-6xl leading-[0.95] md:text-7xl">
              Build Your Career. <span className="gradient-text">Discover Your Next Opportunity.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Discover jobs, connect with companies, manage applications, and track your career
              journey — all from one modern platform.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={isSignedIn ? "/dashboard/jobs" : "/jobs"}
                className="group inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:bg-[var(--primary-hover)]"
              >
                Explore Jobs <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {!isSignedIn && (
                <Link
                  to="/employer/post-job"
                  className="hairline inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-surface/60 px-5 py-3 text-sm font-medium backdrop-blur hover:border-border-strong"
                >
                  For Employers
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. CAREER SEARCH EXPERIENCE — main interaction */}
      <SmartSearch />

      {/* 5. PLATFORM FEATURES */}
      <FeaturesBento />

      {/* 6. CAREER JOURNEY */}
      <CareerJourney />

      {/* 7. FEATURED JOBS */}
      <FeaturedJobs jobs={jobsWithSaved} loading={loadingJobs} />

      {/* 8. CAREER INSIGHTS — real, computed from live jobs */}
      <CareerInsights jobs={jobs} loading={loadingJobs} />

      {/* 9. TESTIMONIALS — split candidate/employer, mirrors the two-sided
          marketplace framing already used in Career Journey above */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Testimonials</div>
          <h2 className="mt-3 font-display text-5xl">Success Stories.</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <div key={i} className="border border-border relative overflow-hidden rounded-[var(--radius-card)] card-surface p-6 sm:p-8 md:p-10">
              <span className="text-xs font-mono uppercase tracking-widest text-primary">{t.side}</span>
              <Quote className="mt-4 h-8 w-8 text-primary/40" />
              <p className="mt-4 font-display text-xl leading-snug sm:text-2xl md:text-3xl">"{t.quote}"</p>
              <div className="mt-8 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-sm font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16" id="faq">
        <h2 className="font-display text-5xl">Frequently Asked Questions.</h2>
        <div className="mt-10 divide-y divide-border">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.question} a={f.answer} />
          ))}
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-32">
        <div className="relative overflow-hidden rounded-[var(--radius-hero)] border border-border bg-gradient-to-br from-primary/30 via-surface to-cyan/20 p-8 text-center sm:p-16">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-5xl md:text-6xl">Your Next Opportunity Starts Here.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              Create your profile, discover jobs, and connect with companies that match your career goals.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:bg-[var(--primary-hover)]"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={isSignedIn ? "/dashboard/jobs" : "/jobs"}
                className="hairline inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-surface/60 px-6 py-3 text-sm font-medium backdrop-blur hover:border-border-strong"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
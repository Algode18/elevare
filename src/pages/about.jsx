import { Link } from "react-router-dom";
import {
  Search, Send, ListChecks, Building2, Users, Sparkles,
  Eye, ShieldCheck, Wand2, ArrowRight,
} from "lucide-react";

const candidateSteps = [
  { icon: Search, text: "Search and browse jobs without needing an account first." },
  { icon: Send, text: "Apply once your profile is set up — it's a single confirm click after that." },
  { icon: ListChecks, text: "Track every application through a real pipeline, from Applied to Hired." },
];

const employerSteps = [
  { icon: ListChecks, text: "Post a job and manage every applicant from one dashboard." },
  { icon: Search, text: "Review candidates against a real pipeline instead of a spreadsheet." },
  { icon: Building2, text: "Build out a company profile that candidates browse before they apply." },
];

const principles = [
  {
    icon: Sparkles,
    title: "Built to be used, not browsed",
    text: "No feature ships unless it does something real. Every screen exists because it solves a step in actually finding or filling a role.",
  },
  {
    icon: Users,
    title: "Two sides, one product",
    text: "Candidates and employers aren't separate apps bolted together — the same pipeline data both sides see is what keeps things honest and current.",
  },
  {
    icon: Eye,
    title: "Transparency",
    text: "Candidates can always see exactly where their application stands, instead of wondering if it disappeared into a black hole.",
  },
  {
    icon: Wand2,
    title: "Simple over clever",
    text: "A clean interface with workflows that actually work beats a flashy one you have to fight with.",
  },
];

const roadmap = [
  { status: "Live now", label: "Core hiring workflow", text: "Search, apply, track, review, and hire — the full loop works end to end today." },
  { status: "Building next", label: "Employer analytics", text: "Deeper hiring-funnel insights and reporting for employer teams, in active development." },
  { status: "Exploring", label: "Interview & analytics tools", text: "Ideas we're evaluating for later — nothing committed yet." },
];

const AboutPage = () => (
  <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
    <div className="text-xs font-mono uppercase tracking-widest text-primary">About</div>
    <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">About Elevare.</h1>
    <div className="mt-6 grid gap-6 text-lg leading-relaxed text-muted-foreground md:grid-cols-2">
      <p>
        Elevare is a career platform built around one idea: hiring should be clear for
        everyone involved.
      </p>
      <p>
        Candidates get a straightforward way to find roles, apply, and track where they
        stand. Recruiters get a real pipeline instead of a spreadsheet of resumes.
      </p>
    </div>

    {/* Mission & Vision */}
    <div className="mt-16 grid gap-6 md:grid-cols-2">
      <div className="hairline rounded-2xl bg-surface/50 p-6">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="mt-3 font-display text-xl">Mission</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Make hiring transparent and straightforward for candidates and employers alike —
          no black-box applications, no spreadsheet chaos.
        </p>
      </div>
      <div className="hairline rounded-2xl bg-surface/50 p-6">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="mt-3 font-display text-xl">Vision</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A single place people trust for their whole job search, and companies trust to
          run their whole hiring process.
        </p>
      </div>
    </div>

    <div className="mt-16 border-t border-border/60 pt-10">
      <h2 className="font-display text-2xl">What Elevare actually is.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        It's a single platform with two sides. On one side, candidates build a profile
        once and use it to apply anywhere on the platform — no re-uploading a resume for
        every job. On the other, employers post roles and run their hiring process from
        one place: applicant review, pipeline stages, and team collaboration, without
        juggling spreadsheets or a dozen email threads.
      </p>
    </div>

    <div className="mt-16 grid gap-6 md:grid-cols-2">
      <div className="hairline rounded-2xl bg-surface/50 p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">For Candidates</div>
        <ul className="mt-4 space-y-4">
          {candidateSteps.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hairline rounded-2xl bg-surface/50 p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">For Employers</div>
        <ul className="mt-4 space-y-4">
          {employerSteps.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Core Values */}
    <div className="mt-16 border-t border-border/60 pt-10">
      <h2 className="font-display text-2xl">Core values.</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {principles.map((p) => (
          <div key={p.title}>
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Roadmap / current status */}
    <div className="mt-16 border-t border-border/60 pt-10">
      <h2 className="font-display text-2xl">Where we are today.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We'd rather tell you what's real today than promise more than the product
        currently does.
      </p>
      <div className="mt-8 space-y-4">
        {roadmap.map((r) => (
          <div key={r.label} className="hairline flex flex-col gap-1 rounded-xl p-5 sm:flex-row sm:items-baseline sm:gap-5">
            <span className="shrink-0 text-xs font-mono uppercase tracking-wider text-primary sm:w-32">
              {r.status}
            </span>
            <div>
              <h3 className="text-sm font-semibold">{r.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom CTA */}
    {/* <div className="mt-16 hairline flex flex-col items-center gap-5 rounded-2xl bg-surface/50 p-10 text-center">
      <h2 className="font-display text-2xl">Ready to start?</h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse jobs <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/employer/post-job"
          className="hairline inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Post a job
        </Link>
      </div>
    </div> */}
  </div>
);

export default AboutPage;
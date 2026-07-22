import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Jobs", to: "/jobs" },
      { label: "Companies", to: "/companies" },
      { label: "Features", to: "/#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQs", to: "/#faq" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Terms and Conditions", to: "/terms" },
    ],
  },
];

const employerLinks = [
  { label: "Manage Jobs", to: "/employer/jobs" },
  { label: "Post a Job", to: "/employer/post-job" },
  { label: "Company Profile", to: "/employer/company" },
  { label: "Dashboard", to: "/employer/dashboard" },
];

const SUPPORT_EMAIL = "support.elevare.app@gmail.com";

// Slim, functional footer shown while an employer is previewing their own
// job listing. It intentionally drops all of the candidate-facing marketing
// content (Product/Resources/Company links, social icons) — none of that is
// relevant to someone previewing their own posting — and surfaces quick
// links back into the employer console instead.
const EmployerFooter = () => (
  <footer className="border-t border-border/60 bg-surface/40">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-[11px] font-bold">
          E
        </div>
        <span className="text-xs text-muted-foreground">
          You're viewing this listing as an employer — this is what candidates see.
        </span>
      </div>

      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {employerLinks.map((l) => (
          <Link key={l.label} to={l.to} className="text-foreground/80 transition-colors hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="text-xs text-muted-foreground">© Elevare {new Date().getFullYear()}</div>
    </div>
  </footer>
);

// Full marketing footer shown to candidates and guests everywhere else.
const CandidateFooter = () => (
  <footer className="border-t border-border/60 bg-background">
    <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
        {/* Brand */}
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">
              E
            </div>
            <span className="font-display text-xl leading-none">Elevare</span>
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            The AI-powered career platform for people who care about their work.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group mt-7 inline-flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            {SUPPORT_EMAIL}
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {c.title}
              </div>
              <ul className="mt-5 space-y-3.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      className="text-foreground/80 transition-colors hover:text-foreground"
                      to={l.to}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="mt-16 flex flex-col items-center gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© Elevare {new Date().getFullYear()}. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <Link to="/terms" className="hover:text-foreground">Terms and Conditions</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </div> */}
    </div>
  </footer>
);

const SiteFooter = () => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  return isPreview ? <EmployerFooter /> : <CandidateFooter />;
};

export default SiteFooter;
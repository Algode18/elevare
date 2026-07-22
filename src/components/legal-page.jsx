import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Clock, ShieldCheck } from "lucide-react";

// Shared shell for legal pages: a sticky section nav next to numbered,
// card-style sections instead of one long unbroken column of text.
// Sections can optionally carry a `group` label (e.g. combining Terms +
// Privacy into one "Terms & Conditions" page) — numbering restarts and a
// group heading is inserted whenever the group changes.
//
// UI/UX redesign only — slugify(), withGroupIndex(), section ids, anchor
// hrefs, props, and the grouping/ordering logic are all unchanged so
// existing routes and #anchors keep working exactly as before.
const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const withGroupIndex = (sections) => {
  let i = 0;
  let lastGroup;
  return sections.map((s) => {
    i = s.group !== lastGroup ? 1 : i + 1;
    lastGroup = s.group;
    return { ...s, index: i, isGroupStart: sections.indexOf(s) === 0 || sections[sections.indexOf(s) - 1].group !== s.group };
  });
};

const estimateReadingTime = (sections) => {
  const words = sections.reduce((acc, s) => acc + s.body.trim().split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 200));
};

const LegalPage = ({ eyebrow = "Legal", title, lastUpdated, intro, sections }) => {
  const indexed = useMemo(() => withGroupIndex(sections), [sections]);
  const readingTime = useMemo(() => estimateReadingTime(sections), [sections]);
  const [activeId, setActiveId] = useState(() => slugify(sections[0]?.title || ""));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Scroll-spy: highlight whichever section is currently in view.
  useEffect(() => {
    const headings = indexed
      .map((s) => document.getElementById(slugify(s.title)))
      .filter(Boolean);
    if (!headings.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [indexed]);

  const grouped = Object.entries(
    indexed.reduce((acc, s) => {
      const key = s.group || "__default";
      (acc[key] ||= []).push(s);
      return acc;
    }, {})
  );

  const NavList = ({ onNavigate }) => (
    <div className="space-y-5">
      {grouped.map(([group, groupSections]) => (
        <div key={group}>
          {group !== "__default" && (
            <div className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
              {group}
            </div>
          )}
          <div className="space-y-0.5">
            {groupSections.map((s) => {
              const id = slugify(s.title);
              const isActive = activeId === id;
              return (
                <a
                  key={s.title}
                  href={`#${id}`}
                  onClick={onNavigate}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                  }`}
                >
                  {s.title}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      {/* Hero */}
      <div className="max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">{eyebrow}</div>
        <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">{title}</h1>
        {intro && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Effective {lastUpdated}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {readingTime} min read
          </span>
        </div>
      </div>

      {/* Mobile: collapsible "On this page" instead of hiding nav entirely */}
      <div className="mt-10 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="hairline flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
          aria-expanded={mobileNavOpen}
        >
          On this page
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileNavOpen && (
          <div className="hairline mt-2 rounded-xl p-4">
            <NavList onNavigate={() => setMobileNavOpen(false)} />
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-12 lg:mt-16 lg:grid-cols-[180px_1fr] lg:gap-14">
        {/* Sticky sidebar */}
        <nav className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Legal Guide
            </div>
            <NavList />
          </div>
        </nav>

        {/* Sections as cards */}
        <div className="min-w-0 space-y-6">
          {indexed.map((s) => (
            <div key={s.title}>
              {s.group && s.isGroupStart && (
                <div className="mb-4 mt-2 flex items-center gap-3 first:mt-0">
                  <h2 className="font-display text-xl text-foreground/90 sm:text-2xl">{s.group}</h2>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              )}
              <section
                id={slugify(s.title)}
                className="hairline scroll-mt-28 rounded-2xl bg-surface/40 p-6 sm:p-8"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xl text-primary/70">{String(s.index).padStart(2, "0")}</span>
                  <h2 className="font-display text-xl sm:text-2xl">{s.title}</h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </section>
            </div>
          ))}

          {/* Contact card */}
          <section className="hairline rounded-2xl bg-surface/60 p-6 sm:p-8">
            <h2 className="font-display text-2xl">Need help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Common things people reach out about:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>· Privacy and how your data is handled</li>
              <li>· Terms of using the platform</li>
              <li>· Deleting your account</li>
              <li>· Requesting a copy of your data</li>
            </ul>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Contact support <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
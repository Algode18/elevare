import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, ArrowRight } from "lucide-react";

const SUGGESTIONS = ["Remote", "Internship", "Frontend", "Backend", "AI", "Startups", "Product", "High salary"];

const CATEGORIES = [
  { label: "🔥 Trending", job_type: "", work_mode: "" },
  { label: "💻 Frontend", job_type: "", work_mode: "", query: "frontend" },
  { label: "⚙️ Backend", job_type: "", work_mode: "", query: "backend" },
  { label: "🤖 AI", job_type: "", work_mode: "", query: "ai" },
  { label: "📱 Mobile", job_type: "", work_mode: "", query: "mobile" },
  { label: "☁️ Cloud", job_type: "", work_mode: "", query: "cloud" },
  { label: "🚀 Startup", job_type: "", work_mode: "", query: "startup" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Turns a loose, chat-like line ("remote react internship") into a best
// guess at query/location/job_type/work_mode filters. This is a plain
// keyword parser, not a model call — it's what makes the search bar feel
// conversational without wiring up a real LLM request from this page.
export function parseAiQuery(raw) {
  const text = raw.toLowerCase();
  const result = { query: raw, job_type: "", work_mode: "" };

  if (/\bremote\b/.test(text)) result.work_mode = "Remote";
  else if (/\bhybrid\b/.test(text)) result.work_mode = "Hybrid";
  else if (/\bon-?site\b/.test(text)) result.work_mode = "On-site";

  if (/\bintern(ship)?\b/.test(text)) result.job_type = "Internship";
  else if (/\bpart-?time\b/.test(text)) result.job_type = "Part-time";
  else if (/\bcontract\b/.test(text)) result.job_type = "Contract";
  else if (/\bfull-?time\b/.test(text)) result.job_type = "Full-time";

  // Strip the recognized filter words out so the leftover feeds the
  // title/keyword search instead of polluting it with "remote".
  result.query = raw
    .replace(/\bremote\b|\bhybrid\b|\bon-?site\b/gi, "")
    .replace(/\bintern(ship)?\b|\bpart-?time\b|\bcontract\b|\bfull-?time\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return result;
}

const AiDiscoverHero = ({ firstName = "there", matchCount = 0, onAiSearch, onCategory }) => {
  const [value, setValue] = useState("");
  const hello = useMemo(greeting, []);

  const submit = () => {
    if (!value.trim()) return;
    onAiSearch(parseAiQuery(value));
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-[var(--radius-hero)] border border-border p-5 sm:p-8">
      <div className="mesh-bg pointer-events-none absolute inset-0 opacity-70" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_top,black,transparent_75%)]" />

      <div className="relative">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl sm:text-4xl"
        >
          {hello}, {firstName} 👋
        </motion.h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">Let's find your next opportunity.</p>

        {matchCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass mt-4 flex flex-nowrap items-center gap-2 rounded-2xl px-3 py-2 sm:mt-5 sm:gap-3 sm:px-4 sm:py-3"
          >
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary sm:h-9 sm:w-9">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0 text-xs sm:text-sm">
              <span className="font-medium text-foreground">{matchCount} matching job{matchCount === 1 ? "" : "s"} available</span>
              <span className="hidden text-muted-foreground sm:inline"> · Updated just now</span>
              <span className="truncate text-muted-foreground sm:hidden"> · Updated now</span>
            </div>
          </motion.div>
        )}

        {/* Search bar — a plain keyword parser (see parseAiQuery above), not
            a model call, so the copy here stays literal instead of implying
            an AI recommendation. */}
        <div className="mt-5 sm:mt-6">
          <div className="glass flex items-center gap-3 rounded-2xl px-3.5 py-2.5 shadow-[var(--shadow-2)] focus-within:border-primary/50 sm:px-4 sm:py-3.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search jobs — try &quot;remote React internship&quot;"
              className="h-full w-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={submit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Search <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setValue(s);
                  onAiSearch(parseAiQuery(s));
                }}
                className="hairline rounded-full bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onCategory(c)}
              className="hairline shrink-0 rounded-full px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-surface-2"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiDiscoverHero;
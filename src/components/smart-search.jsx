import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Repeat,
  Globe,
} from "lucide-react";
import { getCompanies } from "@/api/apiCompanies";
import usePublicFetch from "@/hooks/use-public-fetch";

const intents = [
  { id: "job", label: "Find my next job", icon: Briefcase },
  { id: "companies", label: "Explore companies", icon: Building2 },
  { id: "internships", label: "Find internships", icon: GraduationCap, seed: "internship" },
  { id: "switch", label: "Switch careers", icon: Repeat },
  { id: "remote", label: "Remote opportunities", icon: Globe, seed: "remote" },
];

const popularTags = ["Frontend", "Backend", "AI", "Remote", "Product"];

const placeholderExamples = [
  "Remote React job with 0-2 years experience",
  "Senior backend role at a fintech startup",
  "AI/ML internship for final year students",
  "Product design job, hybrid, Bangalore",
];

const SmartSearch = () => {
  const navigate = useNavigate();
  const [activeIntent, setActiveIntent] = useState("job");
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Loaded once so "Explore companies" can route straight to a specific
  // company page when the typed text matches a real company name, instead
  // of always dropping the user on the full companies list.
  const { data: companies, fn: fnCompanies } = usePublicFetch(getCompanies);
  useEffect(() => {
    fnCompanies();
  }, []);

  // Rotate the placeholder example every few seconds for a bit of life
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholderExamples.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const findCompanyMatch = (text) => {
    if (!companies?.length || !text) return null;
    const needle = text.trim().toLowerCase();
    if (!needle) return null;
    return (
      companies.find((c) => c.name?.toLowerCase() === needle) ||
      companies.find((c) => c.name?.toLowerCase().startsWith(needle)) ||
      companies.find((c) => c.name?.toLowerCase().includes(needle)) ||
      null
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selected = intents.find((i) => i.id === activeIntent);
    const searchValue = query || selected?.seed || "";

    if (activeIntent === "companies") {
      const match = findCompanyMatch(searchValue);
      if (match) {
        navigate(`/companies/${match.id}`);
        return;
      }
      // No confident single match — fall back to the full companies list,
      // pre-filtered by whatever text was typed.
      const params = new URLSearchParams();
      if (searchValue) params.set("search", searchValue);
      navigate(`/companies${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="mx-auto max-w-4xl px-6 mt-10 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="glass rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>What are you looking for today?</span>
        </div>

        {/* Intent picker */}
        <div className="mt-5 flex flex-wrap gap-2">
          {intents.map((intent) => {
            const Icon = intent.icon;
            const active = activeIntent === intent.id;
            return (
              <button
                key={intent.id}
                type="button"
                onClick={() => setActiveIntent(intent.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "hairline text-muted-foreground hover:text-foreground hover:border-border-strong"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {intent.label}
              </button>
            );
          })}
        </div>

        {/* Conversational input */}
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            placeholder={`e.g. "${placeholderExamples[placeholderIndex]}"`}
            className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Popular:</span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="hairline rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border-strong"
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-cyan px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Discover Opportunities
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
};

export default SmartSearch;
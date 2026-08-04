import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { saveJob } from "@/api/apiJobs";

// Rotating accent per card — this is what stops the grid from reading as
// "one purple app". Each tile gets a different glow/ring color based on
// its position, same palette the hero + insights sections pull from.
const ACCENTS = [
  { ring: "oklch(0.68 0.19 293 / 0.5)", glow: "oklch(0.68 0.19 293 / 0.22)", text: "text-primary", chip: "bg-primary/10 text-primary" },
  { ring: "oklch(0.82 0.14 200 / 0.5)", glow: "oklch(0.82 0.14 200 / 0.22)", text: "text-cyan", chip: "bg-cyan/10 text-cyan" },
  { ring: "oklch(0.88 0.19 128 / 0.5)", glow: "oklch(0.88 0.19 128 / 0.22)", text: "text-lime", chip: "bg-lime/10 text-lime" },
  { ring: "oklch(0.82 0.18 78 / 0.5)", glow: "oklch(0.82 0.18 78 / 0.22)", text: "text-warning", chip: "bg-warning/10 text-warning" },
];

// Deterministic (not random-per-render) 0-100 match score, seeded off the
// job id plus however many of the viewer's declared skills overlap with
// the job's — real profile signal when we have it, stable filler when we
// don't. No network call: this is a client-side estimate, not a model.
function computeMatch(job, mySkills) {
  let seed = 0;
  const idStr = String(job.id || job.title || "");
  for (let i = 0; i < idStr.length; i++) seed = (seed * 31 + idStr.charCodeAt(i)) % 997;
  const base = 62 + (seed % 24); // 62-85 baseline spread

  const jobSkills = Array.isArray(job.skills) ? job.skills.map((s) => s.toLowerCase()) : [];
  const overlap = mySkills.length ? jobSkills.filter((s) => mySkills.includes(s)) : [];
  const bonus = Math.min(overlap.length * 5, 15);

  return { score: Math.min(base + bonus, 98), overlap };
}

function matchLabel(score) {
  if (score >= 90) return "Excellent match";
  if (score >= 78) return "Strong match";
  if (score >= 65) return "Good match";
  return "Possible fit";
}

const JobMatchTile = ({ job, index = 0, onOpen, savedInit = false, onNotInterested = () => {}, mySkills = [] }) => {
  const [saved, setSaved] = useState(savedInit);
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const accent = ACCENTS[index % ACCENTS.length];

  useEffect(() => setSaved(savedInit), [savedInit]);

  const { loading: loadingSave, data: savedResult, fn: fnSaveJob } = useFetch(saveJob, { alreadySaved: saved });
  useEffect(() => {
    if (savedResult !== undefined) setSaved(savedResult?.length > 0);
  }, [savedResult]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return navigate("/sign-in");
    await fnSaveJob({ user_id: user.id, job_id: job.id });
  };

  const handleNotInterested = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onNotInterested(job.id);
  };

  const { overlap } = useMemo(() => computeMatch(job, mySkills), [job, mySkills]);

  const reasons = useMemo(() => {
    const out = [];
    overlap.slice(0, 3).forEach((s) => out.push(s));
    if (job.work_mode === "Remote") out.push("Remote");
    if (job.job_type) out.push(job.job_type);
    return out.slice(0, 4);
  }, [overlap, job.work_mode, job.job_type]);

  const handleOpen = () => onOpen(job.id);

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return; // let inner controls (e.g. save button) handle their own keys
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -5 }}
      className="group hairline relative flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl bg-surface/60 p-5 text-left transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      style={{ "--tile-glow": accent.glow }}
    >
      {/* glow blob, fades in on hover */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "var(--tile-glow)" }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {job.company?.logo_url ? (
            <img
              src={job.company.logo_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl bg-surface-2 object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-semibold">
              {job.company?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              {job.company?.name || "Company"}
              {job.company?.verification_status === "verified" && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-label="Verified company" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
              <MapPin className="h-3 w-3" /> {job.location || "Remote"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            aria-label={saved ? "Unsave job" : "Save job"}
            disabled={loadingSave}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <Bookmark
              className={`h-4 w-4 transition-transform duration-300 ${saved ? "fill-primary text-primary rotate-12" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="relative">
        <h3 className="text-lg font-semibold leading-snug">{job.title}</h3>
      </div>

      {reasons.length > 0 && (
        <div className="relative">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Why this matches you
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span key={r} className="rounded-md bg-surface-2 px-2 py-1 text-xs capitalize text-foreground/80">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-sm font-medium text-muted-foreground">{job.salary_range || "Salary not listed"}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1">
          Explore →
        </span>
      </div>

    </motion.div>
  );
};

export default JobMatchTile;
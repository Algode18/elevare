import { Check, X } from "lucide-react";

// Real application status pipeline — backed by the actual `status` enum
// (applied, reviewed, interviewing, offer, hired, rejected). `rejected` is
// a terminal branch off the main line, not a 6th step, so it's rendered
// as its own state rather than squeezed into the progress bar. Shared by
// the candidate pipeline cards and the employer job-applicants view — the
// `status` prop contract is unchanged, only the visuals below are new.
// Elevare brand progression: neutral → purple → blue → cyan, with green
// and red reserved as the only "outcome" colors (hired / rejected).
const STAGES = [
  { key: "applied", label: "Applied", color: "#94A3B8" },
  { key: "reviewed", label: "Reviewed", color: "#6F56F8" },
  { key: "interviewing", label: "Interview", color: "#4F8EF7" },
  { key: "offer", label: "Offer", color: "#22D3EE" },
  { key: "hired", label: "Hired", color: "#10B981" },
];

export function stageColor(status) {
  if (status === "rejected") return "#EF4444";
  return STAGES.find((s) => s.key === status)?.color || "#94A3B8";
}

const PipelineProgress = ({ status }) => {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <X className="h-4 w-4" /> Not moving forward with this application
      </div>
    );
  }

  const activeIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));
  const activeColor = STAGES[activeIndex]?.color || "#A1A1AA";

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between px-1">
        <div className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="absolute left-1 top-1/2 h-px -translate-y-1/2 transition-all duration-500"
          style={{
            width: `${(activeIndex / (STAGES.length - 1)) * 96}%`,
            background: "linear-gradient(90deg, #6F56F8, #4F8EF7, #22D3EE)",
          }}
        />
        {STAGES.map((s, i) => (
          <div key={s.key} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`grid h-5 w-5 place-items-center rounded-full border transition-all ${
                i === activeIndex ? "animate-pulse" : ""
              }`}
              style={
                i < activeIndex
                  ? { borderColor: activeColor, background: activeColor, color: "#0a0a0f" }
                  : i === activeIndex
                    ? { borderColor: s.color, background: `${s.color}33`, boxShadow: `0 0 0 4px ${s.color}22` }
                    : { borderColor: "var(--border)", background: "var(--background)" }
              }
            >
              {i < activeIndex && <Check className="h-3 w-3" />}
            </div>
            <span className={`text-[10px] ${i <= activeIndex ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineProgress;
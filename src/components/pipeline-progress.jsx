import { Check, X } from "lucide-react";

// Real application status pipeline — backed by the actual `status` enum
// (applied, reviewed, interviewing, offer, hired, rejected). `rejected` is
// a terminal branch off the main line, not a 6th step, so it's rendered
// as its own state rather than squeezed into the progress bar.
const STAGES = [
  { key: "applied", label: "Applied" },
  { key: "reviewed", label: "Reviewed" },
  { key: "interviewing", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

const PipelineProgress = ({ status }) => {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <X className="h-4 w-4" /> Not moving forward with this application
      </div>
    );
  }

  const activeIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between px-1">
        <div className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="absolute left-1 top-1/2 h-px -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${(activeIndex / (STAGES.length - 1)) * 96}%` }}
        />
        {STAGES.map((s, i) => (
          <div key={s.key} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`grid h-5 w-5 place-items-center rounded-full border ${
                i < activeIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === activeIndex
                    ? "border-primary bg-primary/20 ring-4 ring-primary/15"
                    : "border-border bg-background text-transparent"
              }`}
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

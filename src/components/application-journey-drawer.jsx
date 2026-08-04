import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Check, Circle, X } from "lucide-react";
import { stageColor } from "@/components/pipeline-progress";

const STAGES = [
  { key: "applied", label: "Applied" },
  { key: "reviewed", label: "Reviewed" },
  { key: "interviewing", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

// "View Journey" — a vertical version of the same real pipeline. Only the
// Applied step gets a real date (application.created_at); every later
// step is shown as done/current/pending, never a fabricated date, since
// this schema doesn't record a timestamp per stage transition.
const ApplicationJourneyDrawer = ({ open, onOpenChange, application }) => {
  if (!application) return null;
  const { status, created_at, job } = application;
  const isRejected = status === "rejected";
  const activeIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerTitle className="sr-only">Application journey</DrawerTitle>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-3">
            {job?.company?.logo_url ? (
              <img src={job.company.logo_url} alt="" className="h-11 w-11 rounded-xl bg-surface-2 object-contain p-1.5" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-sm font-semibold">
                {job?.company?.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <div className="font-semibold leading-snug">{job?.title}</div>
              <div className="text-sm text-muted-foreground">{job?.company?.name}</div>
            </div>
          </div>

          {isRejected && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <X className="h-4 w-4" /> Not moving forward with this application
            </div>
          )}

          <div className="relative flex flex-col gap-6 pl-1">
            <div className="absolute bottom-4 left-[9px] top-4 w-px bg-border" />
            {STAGES.map((s, i) => {
              const done = !isRejected && i < activeIndex;
              const current = !isRejected && i === activeIndex;
              const color = stageColor(s.key);
              return (
                <div key={s.key} className="relative z-10 flex items-start gap-3">
                  <div
                    className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${
                      current ? "animate-pulse" : ""
                    }`}
                    style={
                      done
                        ? { borderColor: color, background: color, color: "#0a0a0f" }
                        : current
                          ? { borderColor: color, background: `${color}33`, boxShadow: `0 0 0 4px ${color}22` }
                          : { borderColor: "var(--border)", background: "var(--background)" }
                    }
                  >
                    {done ? <Check className="h-3 w-3" /> : <Circle className="h-1.5 w-1.5 fill-current text-muted-foreground" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${done || current ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </div>
                    {s.key === "applied" && created_at ? (
                      <div className="text-xs text-muted-foreground">{new Date(created_at).toLocaleDateString()}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {done ? "Completed" : current ? "Current stage" : "Not yet reached"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ApplicationJourneyDrawer;
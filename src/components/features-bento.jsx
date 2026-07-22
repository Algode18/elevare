import { motion } from "framer-motion";
import {
  Bookmark,
  LayoutDashboard,
  FileText,
  ListChecks,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const Badge = ({ children, className = "" }) => (
  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}>
    {children}
  </span>
);

const PanelHeader = ({ icon: Icon, title, description, iconClass, glowClass }) => (
  <div className="flex items-start gap-3">
    <div className="relative shrink-0">
      <div className={`absolute inset-0 rounded-lg blur-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${glowClass}`} />
      <div className={`relative grid h-9 w-9 place-items-center rounded-lg ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div>
      <h3 className="text-base font-semibold leading-tight">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Panel = ({ children, hoverBorder }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -4 }}
    className={`group hairline relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-surface/50 p-6 backdrop-blur transition-colors duration-300 ${hoverBorder}`}
  >
    {children}
  </motion.div>
);

const savedJobsSample = [
  { title: "Senior Frontend Engineer", company: "Google" },
  { title: "Full Stack Developer", company: "Microsoft" },
  { title: "DevOps Engineer", company: "Amazon" },
];
const pipelineStages = ["Applied", "Reviewed", "Interview", "Offer", "Hired"];
const activeStageIndex = 2;
const trendingSkills = [
  { name: "React", change: 18 },
  { name: "TypeScript", change: 12 },
  { name: "AWS", change: 8 },
];
const authFlow = ["Clerk", "Authentication", "JWT", "Secure Session", "Dashboard Access"];

const FeaturesBento = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24" id="features">
      <div className="mb-14 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Platform</div>
        <h2 className="mt-3 font-display text-5xl">See it before you use it.</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Every card below is a live preview of what you'll actually see inside Elevare.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. Saved Jobs — purple/primary */}
        <Panel hoverBorder="hover:border-primary/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={Bookmark}
              title="Saved Jobs"
              description="Which roles did I bookmark?"
              iconClass="bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
              glowClass="bg-primary/30"
            />
            <Badge className="bg-primary/10 text-primary">Your List</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center gap-2 rounded-xl bg-background/60 p-4">
            {savedJobsSample.map((job) => (
              <div key={job.title} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-[10px] text-muted-foreground">{job.company}</div>
                </div>
                <Bookmark className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
              </div>
            ))}
          </div>
        </Panel>

        {/* 2. Employer Dashboard — cyan */}
        <Panel hoverBorder="hover:border-cyan/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={LayoutDashboard}
              title="Employer Dashboard"
              description="How is hiring progressing?"
              iconClass="bg-gradient-to-br from-cyan/20 to-cyan/5 text-cyan"
              glowClass="bg-cyan/30"
            />
            <Badge className="bg-cyan/10 text-cyan">Hiring Live</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center rounded-xl bg-background/60 p-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-cyan">12</div>
                <div className="text-[10px] text-muted-foreground">Active Jobs</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-cyan">148</div>
                <div className="text-[10px] text-muted-foreground">Applicants</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2">
              <div className="h-1.5 w-2/3 rounded-full bg-cyan transition-all duration-500 group-hover:w-4/5" />
            </div>
            <div className="mt-1.5 text-[10px] text-muted-foreground">Hiring progress · 8 in interview stage</div>
          </div>
        </Panel>

        {/* 3. Resume Management — emerald */}
        <Panel hoverBorder="hover:border-emerald-400/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={FileText}
              title="Resume Management"
              description="Is my resume ready to apply?"
              iconClass="bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 text-emerald-400"
              glowClass="bg-emerald-400/30"
            />
            <Badge className="bg-emerald-400/10 text-emerald-400">Attached to Applications</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center rounded-xl bg-background/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Resume.pdf</span>
              <span className="font-medium text-emerald-400">Uploaded</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Updated Today</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span className="text-emerald-400">Ready to Apply</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              One upload — sent automatically with every application you submit.
            </p>
          </div>
        </Panel>

        {/* 4. Application Tracking — orange */}
        <Panel hoverBorder="hover:border-orange-400/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={ListChecks}
              title="Application Tracking"
              description="Where is my application right now?"
              iconClass="bg-gradient-to-br from-orange-400/20 to-orange-400/5 text-orange-400"
              glowClass="bg-orange-400/30"
            />
            <Badge className="bg-orange-400/10 text-orange-400">In Progress</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center rounded-xl bg-background/60 p-4">
            <div className="relative flex items-center justify-between px-1">
              <div className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-border" />
              <div
                className="absolute left-1 top-1/2 h-px -translate-y-1/2 bg-orange-400 transition-all duration-500"
                style={{ width: `${(activeStageIndex / (pipelineStages.length - 1)) * 92}%` }}
              />
              {pipelineStages.map((s, i) => (
                <div
                  key={s}
                  className={`relative z-10 h-2.5 w-2.5 rounded-full ${
                    i < activeStageIndex
                      ? "bg-orange-400"
                      : i === activeStageIndex
                        ? "bg-orange-400 animate-pulse ring-4 ring-orange-400/20"
                        : "border border-border bg-surface-2"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[8px] text-muted-foreground">
              {pipelineStages.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </Panel>

        {/* 5. Career Insights — blue */}
        <Panel hoverBorder="hover:border-blue-400/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={TrendingUp}
              title="Career Insights"
              description="What skills and roles are trending?"
              iconClass="bg-gradient-to-br from-blue-400/20 to-blue-400/5 text-blue-400"
              glowClass="bg-blue-400/30"
            />
            <Badge className="bg-blue-400/10 text-blue-400">Live Data</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center rounded-xl bg-background/60 p-4">
            <div className="space-y-1.5">
              {trendingSkills.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[11px]">
                  <span>{s.name}</span>
                  <span className="text-blue-400">+{s.change}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <svg viewBox="0 0 60 20" className="h-5 w-14 text-blue-400">
                <polyline
                  points="0,18 15,10 30,12 45,4 60,2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[10px] text-muted-foreground">Hiring demand · 92%</span>
            </div>
          </div>
        </Panel>

        {/* 6. Secure Authentication — teal */}
        <Panel hoverBorder="hover:border-teal-400/40">
          <div className="flex items-start justify-between gap-2">
            <PanelHeader
              icon={ShieldCheck}
              title="Secure Authentication"
              description="How is my account protected?"
              iconClass="bg-gradient-to-br from-teal-400/20 to-teal-400/5 text-teal-400"
              glowClass="bg-teal-400/30"
            />
            <Badge className="bg-teal-400/10 text-teal-400">Protected</Badge>
          </div>
          <div className="hairline flex min-h-[150px] flex-col justify-center rounded-xl bg-background/60 p-4">
            <div className="flex flex-col gap-1.5">
              {authFlow.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      i === authFlow.length - 1 ? "bg-teal-400" : "bg-teal-400/40"
                    }`}
                  />
                  <span className="text-[11px]">{step}</span>
                  {i < authFlow.length - 1 && (
                    <span className="ml-auto text-[10px] text-muted-foreground">↓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
};

export default FeaturesBento;
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  UserPlus,
  Building2,
  Search,
  FilePlus2,
  Send,
  ClipboardCheck,
  MessagesSquare,
  CalendarClock,
  Award,
  Handshake,
} from "lucide-react";

const steps = [
  {
    candidate: { icon: UserPlus, title: "Create Profile", body: "Add skills, projects, and resume." },
    employer: { icon: Building2, title: "Create Company", body: "Add your company details and branding." },
  },
  {
    candidate: { icon: Search, title: "Discover Jobs", body: "Browse AI-matched roles built around you." },
    employer: { icon: FilePlus2, title: "Publish Job", body: "Post a role in minutes, structured and clear." },
  },
  {
    candidate: { icon: Send, title: "Apply", body: "Submit with one click, no repeated forms." },
    employer: { icon: ClipboardCheck, title: "Review Application", body: "See every applicant in one real pipeline." },
  },
  {
    candidate: { icon: MessagesSquare, title: "Interview", body: "Move forward with engaged recruiters." },
    employer: { icon: CalendarClock, title: "Schedule Interview", body: "Coordinate directly from the applicant status." },
  },
  {
    candidate: { icon: Award, title: "Offer Accepted", body: "Confirm the offer and lock in your next role." },
    employer: { icon: Handshake, title: "Hire Candidate", body: "Close the loop and bring them on board." },
  },
];

const NodeCard = ({ step, align }) => {
  const Icon = step.icon;
  const isRight = align === "right";
  return (
    <div
      className={`relative flex items-center gap-4 ${
        isRight ? "flex-row max-w-sm mr-auto" : "flex-row-reverse text-right max-w-sm ml-auto"
      }`}
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg opacity-0 transition-opacity duration-300 group-hover/row:opacity-100" />
        <div className="hairline relative grid h-12 w-12 place-items-center rounded-full bg-surface/80 backdrop-blur transition-all duration-300 group-hover/row:border-primary group-hover/row:scale-110">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <div className="font-semibold">{step.title}</div>
        <div className="grid transition-all duration-300 grid-rows-[0fr] group-hover/row:grid-rows-[1fr]">
          <p className="overflow-hidden text-sm text-muted-foreground opacity-0 transition-opacity duration-300 group-hover/row:opacity-100">
            → {step.body}
          </p>
        </div>
      </div>
    </div>
  );
};

const CareerJourney = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.5"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Process</div>
        <h2 className="mt-3 font-display text-5xl">Your Career Journey.</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          One connected path — every step for candidates has a mirrored step for employers.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <span>Candidate</span>
        <span className="text-right">Employer</span>
      </div>

      <div ref={containerRef} className="relative">
        {/* Static base spine */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-border/40" />

        {/* Scroll-grown gradient spine */}
        <motion.div
          style={{ scaleY: lineScale, transformOrigin: "top" }}
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-primary via-cyan to-primary shadow-[0_0_12px_theme(colors.primary.DEFAULT)]"
        />

        {/* Traveling glow comet */}
        <motion.div
          className="pointer-events-none absolute left-1/2 h-20 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan/0 via-cyan to-cyan/0 blur-[2px]"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />

        <div className="flex flex-col gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.candidate.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group/row relative grid grid-cols-2 items-center gap-3 md:gap-4"
            >
              {/* Per-row line highlight, lights up when either side is hovered */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/50 opacity-0 blur-[3px] transition-opacity duration-300 group-hover/row:opacity-100" />
              <NodeCard step={step.candidate} align="left" />
              <NodeCard step={step.employer} align="right" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerJourney;
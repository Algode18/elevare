import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { FileText, Layers, Briefcase, Calendar, Layers3, Award } from "lucide-react";

// Central "glass intelligence core" + orbiting career modules — no fake
// scores, no fake percentages, no fake company matches. Each module is a
// visual representation of a real Elevare surface (Resume, Portfolio,
// Briefcase/Jobs, Interview calendar, Projects, Skills, Certificates,
// Application timeline) with independent motion, plus subtle whole-scene
// mouse parallax.

const DECOR_SHAPES = [
  { shape: "circle", top: "10%", left: "8%", size: 14 },
  { shape: "diamond", top: "78%", left: "14%", size: 12 },
  { shape: "hexagon", top: "16%", left: "85%", size: 16 },
  { shape: "square", top: "84%", left: "80%", size: 12 },
  { shape: "spark", top: "48%", left: "4%", size: 14 },
  { shape: "node", top: "6%", left: "50%", size: 8 },
  { shape: "node", top: "92%", left: "48%", size: 8 },
];

const JOURNEY_STEPS = ["Profile", "Resume", "Applications", "Interviews", "Offers"];

const DecorShape = ({ shape, size }) => {
  const common = "text-[#6F56F8]";
  if (shape === "circle") return <div className={`rounded-full border ${common}`} style={{ width: size, height: size, borderColor: "currentColor" }} />;
  if (shape === "square") return <div className={`rounded-md border ${common}`} style={{ width: size, height: size, borderColor: "currentColor" }} />;
  if (shape === "diamond") return <div className={`border ${common}`} style={{ width: size, height: size, borderColor: "currentColor", transform: "rotate(45deg)" }} />;
  if (shape === "hexagon")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={common}>
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  if (shape === "spark")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={common}>
        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor" />
      </svg>
    );
  return <div className={`rounded-full ${common}`} style={{ width: size, height: size, background: "currentColor" }} />;
};

// A floating module positioned around the orb. `angle`/`radius` place it;
// its own motion (float/tilt/rotate) is independent of the orbit position.
const OrbitModule = ({ angle, radius, size = 64, motionType = "float", delay = 0, mx, my, parallax = 10, children }) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  const px = useTransform(mx, [-1, 1], [-parallax, parallax]);
  const py = useTransform(my, [-1, 1], [-parallax, parallax]);

  const motionProps =
    motionType === "float"
      ? { animate: { y: [0, -10, 0] }, transition: { duration: 5, delay, repeat: Infinity, ease: "easeInOut" } }
      : motionType === "tilt"
      ? { animate: { rotate: [-6, 6, -6] }, transition: { duration: 6, delay, repeat: Infinity, ease: "easeInOut" } }
      : motionType === "spin"
      ? { animate: { rotateY: [0, 360] }, transition: { duration: 10, delay, repeat: Infinity, ease: "linear" } }
      : { animate: { y: [0, -6, 0], rotate: [0, 3, 0] }, transition: { duration: 7, delay, repeat: Infinity, ease: "easeInOut" } };

  return (
    <motion.div
      className="absolute grid place-items-center"
      style={{
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
        x: px,
        y: py,
        perspective: 400,
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: delay * 0.3 }}
    >
      <motion.div className="h-full w-full" {...motionProps}>
        {children}
      </motion.div>
    </motion.div>
  );
};

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`grid h-full w-full place-items-center rounded-2xl border border-border bg-card/70 shadow-[0_12px_30px_rgba(124,92,255,0.16)] backdrop-blur-md ${className}`}
  >
    {children}
  </div>
);

const SkillsCube = () => (
  <div style={{ transformStyle: "preserve-3d" }} className="relative h-9 w-9">
    {[0, 90, 180, 270].map((deg, i) => (
      <div
        key={deg}
        className="absolute inset-0 rounded-md border border-white/50"
        style={{
          background: ["#6F56F8", "#4F8EF7", "#4F8EF7", "#8B6BFF"][i],
          opacity: 0.85,
          transform: `rotateY(${deg}deg) translateZ(18px)`,
        }}
      />
    ))}
  </div>
);

const AuthIllustration = () => {
  const [active, setActive] = useState(1);
  const containerRef = useRef(null);
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % JOURNEY_STEPS.length), 2200);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const glowX = useTransform(mx, [-1, 1], [-6, 6]);
  const glowY = useTransform(my, [-1, 1], [-6, 6]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      className="flex h-full flex-col justify-between overflow-hidden px-10 py-12"
    >
      {/* Layered depth background — soft radial glow + subtle grid + noise */}
      <div className="pointer-events-none absolute inset-0">
        <svg className="absolute inset-0 h-0 w-0">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.48  0 0 0 0 0.36  0 0 0 0 1  0 0 0 0.02 0" />
          </filter>
        </svg>
        <div className="absolute inset-0" style={{ filter: "url(#grain)" }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #6F56F8 1px, transparent 1px), linear-gradient(to bottom, #6F56F8 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {DECOR_SHAPES.map((d, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.08]"
            style={{ top: d.top, left: d.left }}
            animate={{ y: [0, -8, 0], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <DecorShape shape={d.shape} size={d.size} />
          </motion.div>
        ))}
      </div>

      {/* 3D scene stage */}
      <div className="relative mx-auto flex h-[380px] w-full max-w-[440px] items-center justify-center" style={{ perspective: 800 }}>
        {/* Central glass orb — the career intelligence core */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: 150,
            height: 150,
            x: glowX,
            y: glowY,
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), rgba(124,92,255,0.35) 40%, rgba(52,214,255,0.25) 75%, rgba(124,92,255,0.15) 100%)",
            boxShadow: "0 0 70px rgba(124,92,255,0.35), inset 0 0 40px rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
          }}
          animate={{ scale: [1, 1.04, 1], rotate: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{ background: "radial-gradient(circle at 65% 70%, rgba(255,255,255,0.5), transparent 60%)" }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Orbiting modules — real product surfaces, no fabricated numbers */}
        <OrbitModule angle={-100} radius={150} size={68} motionType="float" delay={0} mx={mx} my={my} parallax={8}>
          <GlassCard>
            <FileText className="h-6 w-6 text-[#6F56F8]" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={-20} radius={165} size={72} motionType="tilt" delay={1} mx={mx} my={my} parallax={10}>
          <GlassCard className="flex-col gap-1 !justify-start p-2">
            <div className="flex w-full gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8EF7]/60" />
            </div>
            <div className="mt-1 h-1 w-8 rounded-full bg-[#6F56F8]/30" />
            <div className="mt-1 h-1 w-6 rounded-full bg-[#6F56F8]/20" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={50} radius={155} size={64} motionType="tilt" delay={0.5} mx={mx} my={my} parallax={8}>
          <GlassCard>
            <Briefcase className="h-5 w-5 text-[#4F8EF7]" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={130} radius={170} size={68} motionType="drift" delay={1.5} mx={mx} my={my} parallax={10}>
          <GlassCard>
            <Calendar className="h-5 w-5 text-[#4F8EF7]" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={-160} radius={130} size={56} motionType="float" delay={0.8} mx={mx} my={my} parallax={6}>
          <GlassCard>
            <Layers className="h-5 w-5 text-[#6F56F8]" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={20} radius={140} size={58} motionType="spin" delay={0} mx={mx} my={my} parallax={6}>
          <div style={{ perspective: 300 }} className="grid h-full w-full place-items-center">
            <SkillsCube />
          </div>
        </OrbitModule>

        <OrbitModule angle={165} radius={110} size={50} motionType="float" delay={1.2} mx={mx} my={my} parallax={5}>
          <GlassCard>
            <Award className="h-4.5 w-4.5 text-[#4F8EF7]" />
          </GlassCard>
        </OrbitModule>

        <OrbitModule angle={95} radius={200} size={40} motionType="drift" delay={0.3} mx={mx} my={my} parallax={7}>
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card/60 px-2 py-1.5 shadow-[0_10px_24px_rgba(124,92,255,0.12)] backdrop-blur-md">
            <Layers3 className="h-3.5 w-3.5 text-primary" />
            <div className="h-4 w-px bg-[#6F56F8]/30" />
            <span className="h-1 w-1 rounded-full bg-[#6F56F8]/50" />
          </div>
        </OrbitModule>
      </div>

      {/* Bottom copy */}
      <div className="relative mx-auto max-w-sm text-center">
        <h2 className="text-3xl font-bold leading-tight text-foreground">One workspace for every career move.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Build your profile, manage multiple resumes, track applications, organize interviews, and apply
          with confidence — all from one intelligent workspace.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground/70">
          {JOURNEY_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className={`transition-colors duration-500 ${i === active ? "text-primary" : ""}`}>{step}</span>
              {i < JOURNEY_STEPS.length - 1 && <span className="text-border-strong">•</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthIllustration;
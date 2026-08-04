import { motion } from "framer-motion";

// Layered, slow-drifting blurred gradient orbs — different sizes, blur
// amounts, and speeds per layer create a depth/parallax illusion behind
// content, replacing the flat grid background across the workspace pages.
const orbs = [
  { className: "left-[-10%] top-[-15%] h-[420px] w-[420px] bg-primary/25 blur-[110px]", duration: 22, range: [0, 40, -20, 0] },
  { className: "right-[-15%] top-[5%] h-[360px] w-[360px] bg-cyan/20 blur-[100px]", duration: 26, range: [0, -30, 20, 0] },
  { className: "bottom-[-20%] left-[20%] h-[300px] w-[300px] bg-primary/15 blur-[90px]", duration: 30, range: [0, 25, -25, 0] },
];

const AmbientOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {orbs.map((orb, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full ${orb.className}`}
        style={{ mixBlendMode: "screen" }}
        animate={{
          x: orb.range,
          y: orb.range.map((v) => v * 0.6),
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: orb.duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "radial-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    />
  </div>
);

export default AmbientOrbs;
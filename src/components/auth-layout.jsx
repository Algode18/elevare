import AuthIllustration from "./auth-illustration";
import ThemeToggle from "./theme-toggle";

const COPY = {
  "sign-in": { heading: "Welcome Back", subheading: "Continue your career journey." },
  "sign-up": { heading: "Create your account", subheading: "Continue your career journey." },
};

const AuthLayout = ({ mode, children }) => {
  const copy = COPY[mode];

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      <ThemeToggle className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6" />

      {/* Left — 50% — 3D career orb experience */}
      <div
        className="relative hidden w-1/2 overflow-hidden lg:block"
        style={{
          background:
            "linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 40%, var(--accent) 70%, var(--accent-cyan-bg) 100%)",
        }}
      >
        <AuthIllustration />
      </div>

      {/* Right — 50% — auth form, calm and distraction-free */}
      <div className="scrollbar-none relative flex w-full flex-col items-center overflow-y-auto bg-background px-6 py-10 lg:w-1/2 lg:px-16">
        {/* Seam blend — dark theme only. The left panel's gradient just
            stops dead at the 50% mark against the right panel's flat
            --background, which reads as a hard seam. This softly bleeds
            the same accent color in from the left edge of this panel and
            blurs it out, so the two halves blend into each other around
            the middle instead of cutting off. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-2/3 dark:block"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 0% 50%, var(--accent-cyan-bg) 0%, rgba(111,86,248,0.12) 30%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />

        {/* Grid line pattern — same grid as the left panel. The right panel
            sits on the flat --background (much darker than the left panel's
            --surface/--surface-2 gradient), so it needs a higher opacity to
            actually read as the same pattern rather than disappearing. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #6F56F8 1px, transparent 1px), linear-gradient(to bottom, #6F56F8 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative w-full max-w-[380px]">
          <a href="/" className="mb-6 mt-[-8px] flex items-center justify-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-[#6F56F8] to-[#4F8EF7] text-xs font-bold text-white">
              E
            </div>
            <span className="text-xl font-bold leading-none text-foreground">Elevare</span>
          </a>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{copy.heading}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{copy.subheading}</p>
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
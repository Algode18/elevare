import { Link, useSearchParams } from "react-router-dom";
import { Show, UserButton, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Heart, LayoutDashboard, PenBox, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search] = useSearchParams();
  const { user, isSignedIn } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
  const isPreview = search.get("preview") === "1";
  // Candidates get a dedicated mobile dashboard nav later — hide this
  // marketing-nav hamburger for them once signed in. Still shown for
  // signed-out visitors and for recruiters.
  const showMobileMenuButton = !isPreview && !(isSignedIn && !isRecruiter);

  // Transparent at the top of the page, blurred + solid once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route/param changes
  useEffect(() => {
    setMobileOpen(false);
  }, [search]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "navbar-frosted" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">E</div>
          <span className="font-display text-xl leading-none">Elevare</span>
        </Link>

        <div className="flex flex-1 justify-center">
          {isPreview ? null : (
            <Show when="signed-out">
              <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
                <Link to="/jobs" className="hover:text-foreground">Jobs</Link>
                <Link to="/companies" className="hover:text-foreground">Companies</Link>
                <Link to="/about" className="hover:text-foreground">About</Link>
              </nav>
            </Show>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {isPreview ? (
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }}>
              <UserButton.MenuItems>
                <UserButton.Link label="My Jobs" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/jobs" />
                <UserButton.Link label="Company" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/company" />
              </UserButton.MenuItems>
            </UserButton>
          ) : (
            <>
              <Show when="signed-out">
                <Link
                  to="/sign-in"
                  className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:px-3 sm:text-sm"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-[var(--radius-btn)] bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:bg-[var(--primary-hover)] sm:px-3.5 sm:text-sm"
                >
                  Get Started
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  to={isRecruiter ? "/employer/dashboard" : "/dashboard"}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:gap-1.5 sm:px-3.5 sm:text-sm"
                >
                  <LayoutDashboard size={14} className="sm:hidden" />
                  <LayoutDashboard size={15} className="hidden sm:block" />
                  Dashboard
                </Link>
                {isRecruiter && (
                  <Link
                    to="/employer/post-job"
                    className="inline-flex items-center gap-1 rounded-[var(--radius-btn)] bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:bg-[var(--primary-hover)] sm:gap-1.5 sm:px-3.5 sm:text-sm"
                  >
                    <PenBox size={14} /> Post a Job
                  </Link>
                )}
                <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }}>
                  <UserButton.MenuItems>
                    {isRecruiter && (
                      <UserButton.Link label="My Jobs" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/jobs" />
                    )}
                    {isRecruiter && (
                      <UserButton.Link label="Company" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/company" />
                    )}
                    {!isRecruiter && (
                      <UserButton.Link label="My Applications" labelIcon={<BriefcaseBusiness size={15} />} href="/applications" />
                    )}
                    {!isRecruiter && (
                      <UserButton.Link label="Saved Jobs" labelIcon={<Heart size={15} />} href="/saved" />
                    )}
                  </UserButton.MenuItems>
                </UserButton>
              </Show>

              {showMobileMenuButton && (
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  className="-mr-2 ml-1 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {mobileOpen && showMobileMenuButton && (
        <div className="glass border-t-0 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            <Link
              to="/jobs"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              Jobs
            </Link>
            <Link
              to="/companies"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              Companies
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              About
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
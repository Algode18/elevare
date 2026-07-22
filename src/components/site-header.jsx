import { Link, useSearchParams } from "react-router-dom";
import { Show, SignIn, UserButton, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Heart, LayoutDashboard, PenBox } from "lucide-react";

const SiteHeader = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { user } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";
  const isPreview = search.get("preview") === "1";

  useEffect(() => {
    if (search.get("sign-in")) setShowSignIn(true);
  }, [search]);

  // Transparent at the top of the page, blurred + solid once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6">
          <Link to="/" className="flex items-center gap-2 justify-self-start">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">E</div>
            <span className="font-display text-xl leading-none">Elevare</span>
          </Link>

          {isPreview ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs text-muted-foreground md:flex">
              Previewing your job posting
            </span>
          ) : (
            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <Link to="/jobs" className="hover:text-foreground">Jobs</Link>
              <Link to="/companies" className="hover:text-foreground">Companies</Link>
              <Link to="/about" className="hover:text-foreground">About</Link>
            </nav>
          )}

          <div className="flex items-center gap-2 justify-self-end">
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
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:block"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="rounded-md bg-foreground px-3.5 py-1.5 text-sm font-medium text-background hover:opacity-90"
                  >
                    Get Started
                  </button>
                </Show>
                <Show when="signed-in">
                  <Link
                    to={isRecruiter ? "/employer/dashboard" : "/dashboard"}
                    className="hidden items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  {isRecruiter && (
                    <Link
                      to="/employer/post-job"
                      className="hidden items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 text-sm font-medium text-background hover:opacity-90 sm:inline-flex"
                    >
                      <PenBox size={15} /> Post a Job
                    </Link>
                  )}
                  <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }}>
                    <UserButton.MenuItems>
                      {isRecruiter ? (
                        <>
                          <UserButton.Link label="My Jobs" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/jobs" />
                          <UserButton.Link label="Company" labelIcon={<BriefcaseBusiness size={15} />} href="/employer/company" />
                        </>
                      ) : (
                        <>
                          <UserButton.Link label="My Applications" labelIcon={<BriefcaseBusiness size={15} />} href="/applications" />
                          <UserButton.Link label="Saved Jobs" labelIcon={<Heart size={15} />} href="/saved" />
                        </>
                      )}
                    </UserButton.MenuItems>
                  </UserButton>
                </Show>
              </>
            )}
          </div>
        </div>
      </header>

      {showSignIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={handleOverlayClick}
        >
          <SignIn signUpForceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding" />
        </div>
      )}
    </>
  );
};

export default SiteHeader;
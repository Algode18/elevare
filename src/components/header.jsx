import { Link, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Show, SignIn, UserButton, useUser } from "@clerk/react";
import { BriefcaseBusiness, Heart, LayoutDashboard, PenBox } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [search, setSearch] = useSearchParams();

  const { user } = useUser();
  const isRecruiter = user?.unsafeMetadata?.role === "recruiter";

  useEffect(() => {
    if (search.get("sign-in")) {
      setShowSignIn(true);
    }
  }, [search]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <>
      <nav className="py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-sm font-bold">E</div>
          <span className="font-display text-2xl leading-none">Elevare</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
            Find Jobs
          </Link>
          <Link to="/companies" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
            Companies
          </Link>

          <Show when="signed-out">
            <Button variant="outline" onClick={() => setShowSignIn(true)}>
              Login
            </Button>
          </Show>
          <Show when="signed-in">
            <Link to={isRecruiter ? "/employer/dashboard" : "/dashboard"}>
              <Button variant="outline" className="rounded-full">
                <LayoutDashboard size={18} className="mr-2" />
                Dashboard
              </Button>
            </Link>
            {isRecruiter && (
              <Link to="/employer/post-job">
                <Button variant="destructive" className="rounded-full">
                  <PenBox size={20} className="mr-2" />
                  Post a Job
                </Button>
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            >
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
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={handleOverlayClick}
        >
          <SignIn
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </>
  );
};

export default Header;

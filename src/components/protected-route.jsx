import { useUser } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import { BarLoader } from "react-spinners";

// `role`, when passed, gates the route to that specific onboarded role
// (e.g. role="recruiter" for every /employer/* page). Without it, this
// only guarantees the visitor is signed in and has finished onboarding —
// which is how candidates were previously able to open employer-only pages
// like the Employer Dashboard directly (e.g. via the footer link) and see a
// broken, empty view instead of being redirected to their own dashboard.
const ProtectedRoute = ({ children, role }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { pathname } = useLocation();

  // Previously, every check below only fired once `user`/`isSignedIn` were
  // defined — but both are `undefined` while Clerk is still loading, so
  // every check was skipped and `children` rendered anyway, before we knew
  // if the visitor was even signed in or had the right role. Each page
  // happened to guard itself too, which masked this, but any new page that
  // forgot to would render with a genuinely unknown user. Bail out here
  // instead and let auth resolve first.
  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  if (!user?.unsafeMetadata?.role && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" />;
  }

  if (role && user?.unsafeMetadata?.role && user.unsafeMetadata.role !== role) {
    return <Navigate to={role === "recruiter" ? "/dashboard" : "/employer/dashboard"} />;
  }

  return children;
};

export default ProtectedRoute;
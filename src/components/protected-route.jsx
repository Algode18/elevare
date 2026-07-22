import { useUser } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";

// `role`, when passed, gates the route to that specific onboarded role
// (e.g. role="recruiter" for every /employer/* page). Without it, this
// only guarantees the visitor is signed in and has finished onboarding —
// which is how candidates were previously able to open employer-only pages
// like the Employer Dashboard directly (e.g. via the footer link) and see a
// broken, empty view instead of being redirected to their own dashboard.
const ProtectedRoute = ({ children, role }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { pathname } = useLocation();

  if (isLoaded && !isSignedIn && isSignedIn !== undefined) {
    return <Navigate to="/?sign-in=true" />;
  }

  if (
    user !== undefined &&
    !user?.unsafeMetadata?.role &&
    pathname !== "/onboarding"
  )
    return <Navigate to="/onboarding" />;

  if (
    role &&
    user !== undefined &&
    user?.unsafeMetadata?.role &&
    user.unsafeMetadata.role !== role
  ) {
    return <Navigate to={role === "recruiter" ? "/dashboard" : "/employer/dashboard"} />;
  }

  return children;
};

export default ProtectedRoute;
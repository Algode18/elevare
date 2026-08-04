import { Outlet } from "react-router-dom";
import { useUser } from "@clerk/react";
import AppShell from "@/components/elevare/app-shell";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

// Companies / Company Details are the one pair of pages reachable by both
// guests and signed-in candidates. A guest gets the marketing chrome
// (header + footer); a signed-in candidate gets the workspace sidebar
// instead, so they never leave the app-shell experience to research a
// company mid-session. Same page components either way — only the
// surrounding chrome differs.
const AdaptiveCompaniesLayout = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
};

export default AdaptiveCompaniesLayout;
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

// Full-bleed layout for every public/guest-accessible page (landing, jobs,
// job details, companies, company details, about, contact). No `.container`
// wrapper or grid background here since each page renders its own sections.
const MarketingLayout = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Give the target page a tick to render before we try to find the element
      const id = hash.replace("#", "");
      const scrollToTarget = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      const timeout = setTimeout(scrollToTarget, 80);
      return () => clearTimeout(timeout);
    }
    // No hash — reset scroll position on normal route changes
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
};

export default MarketingLayout;
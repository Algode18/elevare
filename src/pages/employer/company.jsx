import { getMyCompanies } from "@/api/apiCompanies";
import { getMyJobs } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/add-company-drawer";
import BackButton from "@/components/back-button";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Building2, Settings2 } from "lucide-react";

// Admin-table treatment — deliberately different from the card-grid pattern
// used on companies.jsx / employer/jobs.jsx, since this is a management
// list an employer scans quickly, not something they browse for feel.
// Scoped to companies THIS recruiter owns (getMyCompanies) — the full
// public directory lives on /companies for candidates/guests instead.
const EmployerCompanyPage = () => {
  const { user, isLoaded } = useUser();
  const { data: companies, loading, fn } = useFetch(getMyCompanies, { owner_id: user?.id });
  const { data: myJobs, fn: fnMyJobs } = useFetch(getMyJobs, { recruiter_id: user?.id });

  useEffect(() => {
    if (isLoaded && user) {
      fn();
      fnMyJobs();
    }
  }, [isLoaded, user]);

  const usageByCompany = useMemo(() => {
    const map = {};
    (myJobs || []).forEach((j) => {
      map[j.company_id] = (map[j.company_id] || 0) + 1;
    });
    return map;
  }, [myJobs]);

  return (
    <div>
      <BackButton fallbackTo="/employer/dashboard" label="Back to Dashboard" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Companies you manage. Add a new one to post a job under it.
          </p>
        </div>
        <AddCompanyDrawer fetchCompanies={fn} />
      </div>

      {loading !== false && <BarLoader width={"100%"} color="var(--primary)" />}

      {loading === false && (
        <div className="hairline overflow-hidden rounded-xl bg-surface/60">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border/60 px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <span>Company</span>
            <span>Your postings</span>
          </div>
          {companies?.length ? (
            companies.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border/40 px-5 py-3 last:border-b-0 hover:bg-surface-2/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-8 w-8 shrink-0 rounded object-contain" />
                  ) : (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-surface-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                  )}
                  <span className="truncate text-sm font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      usageByCompany[c.id]
                        ? "rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {usageByCompany[c.id] || 0} job{usageByCompany[c.id] === 1 ? "" : "s"}
                  </span>
                  <Link
                    to={`/employer/company/${c.id}/workspace`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="h-3 w-3" /> Manage
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No companies yet — add one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployerCompanyPage;
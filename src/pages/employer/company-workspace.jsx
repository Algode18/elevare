import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import { ShieldAlert } from "lucide-react";

import BackButton from "@/components/back-button";
import WorkspaceShell from "@/components/workspace/workspace-shell";
import OverviewBrandingTab from "@/components/workspace/overview-branding-tab";
import OfficesTab from "@/components/workspace/offices-tab";
import HiringSocialTab from "@/components/workspace/hiring-social-tab";
import TeamTab from "@/components/workspace/team-tab";
import AnalyticsTab from "@/components/workspace/analytics-tab";
import SettingsTab from "@/components/workspace/settings-tab";
import useFetch from "@/hooks/use-fetch";
import { getCompanyById } from "@/api/apiCompanies";

const CompanyWorkspacePage = () => {
  const { companyId } = useParams();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [company, setCompany] = useState(null);

  const { data, loading, fn: fnCompany } = useFetch(getCompanyById, { company_id: companyId });

  useEffect(() => {
    if (isLoaded && companyId) fnCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, companyId]);

  useEffect(() => {
    if (data) setCompany(data);
  }, [data]);

  const isOwner = Boolean(user?.id && company?.owner_id === user.id);

  if (!isLoaded || loading !== false) {
    return <BarLoader width={"100%"} color="#7c5cff" />;
  }

  if (!company) {
    return (
      <div>
        <BackButton fallbackTo="/employer/company" label="Companies" />
        <div className="hairline rounded-xl bg-surface/60 p-10 text-center text-sm text-muted-foreground">
          Company not found.
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div>
        <BackButton fallbackTo="/employer/company" label="Companies" />
        <div className="hairline flex flex-col items-center gap-2 rounded-xl bg-surface/60 p-10 text-center">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">You don't have owner access to this workspace.</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Only {company.name}'s owner can manage its profile, offices, hiring preferences, and team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackButton fallbackTo="/employer/company" label="Companies" />

      <WorkspaceShell company={company} activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "overview" && <OverviewBrandingTab company={company} onUpdated={setCompany} />}
        {activeTab === "offices" && <OfficesTab company={company} />}
        {activeTab === "hiring-social" && <HiringSocialTab company={company} onUpdated={setCompany} />}
        {activeTab === "team" && <TeamTab company={company} />}
        {activeTab === "analytics" && <AnalyticsTab company={company} />}
        {activeTab === "settings" && <SettingsTab company={company} onUpdated={setCompany} />}
      </WorkspaceShell>
    </div>
  );
};

export default CompanyWorkspacePage;
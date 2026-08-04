import { cn } from "@/lib/utils";
import { Chip } from "@/components/elevare-primitives";
import {
  Building2,
  Palette,
  MapPin,
  Share2,
  Users,
  BarChart3,
  SlidersHorizontal,
  Building,
} from "lucide-react";

// Tab metadata lives here (shell's concern: icons + labels + ordering).
// Each tab's actual content component is wired up by the page that uses
// this shell — keeps this file free of dependencies on components that
// haven't been built yet.
export const WORKSPACE_TABS = [
  { key: "overview", label: "Overview & Branding", icon: Building2 },
  { key: "offices", label: "Offices", icon: MapPin },
  { key: "hiring-social", label: "Hiring & Social", icon: Share2 },
  // { key: "team", label: "Team Members", icon: Users },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SlidersHorizontal },
];

const VERIFICATION_TONE = {
  verified: "cyan",
  pending: "warn",
  rejected: "danger",
};

const VERIFICATION_LABEL = {
  verified: "Verified",
  pending: "Verification pending",
  rejected: "Verification rejected",
};

const WorkspaceShell = ({ company, activeTab, onTabChange, children }) => {
  return (
    <div>
      {/* Company header — banner + logo + identity, always visible above the tabs */}
      <div className="mb-5 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-1)] sm:mb-8">
        <div
          className="h-28 w-full bg-surface-2 bg-cover bg-center sm:h-36"
          style={
            company?.banner_url
              ? { backgroundImage: `url(${company.banner_url})` }
              : { backgroundImage: "linear-gradient(135deg, var(--primary)/15, var(--cyan)/10)" }
          }
        />
        <div className="flex flex-row items-start justify-between gap-3 px-5 pb-5 pt-4 sm:items-center">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-14 w-14 shrink-0 rounded-lg border border-border bg-surface object-contain sm:h-20 sm:w-20"
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground sm:h-20 sm:w-20">
                <Building className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg leading-tight sm:text-2xl">{company?.name || "—"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {company?.industry && <span>{company.industry}</span>}
                {company?.headquarters && (
                  <>
                    <span className="text-border">•</span>
                    <span>{company.headquarters}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {company?.verification_status && (
              <Chip tone={VERIFICATION_TONE[company.verification_status] || "default"}>
                {VERIFICATION_LABEL[company.verification_status] || company.verification_status}
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav — horizontal, sits under the banner (the page already has its own left sidebar).
          Mobile: tabs keep their natural width and the row scrolls horizontally, so labels never
          wrap or clip. Desktop: reverts to equal-width tabs filling the bar, same as before. */}
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-card p-1.5 shadow-[var(--shadow-1)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {WORKSPACE_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-b-2 px-3.5 py-2 text-sm transition-colors sm:flex-1",
                isActive
                  ? "border-primary bg-surface-2 font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-surface-2/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-primary")} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Active panel */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-1)] sm:p-6">{children}</div>
    </div>
  );
};

export default WorkspaceShell;
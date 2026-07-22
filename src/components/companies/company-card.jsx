import { Link } from "react-router-dom";
import { Building2, MapPin, Users, ArrowUpRight, BadgeCheck } from "lucide-react";
import { Chip } from "@/components/elevare-primitives";

// Premium discovery-grid card — logo, identity line, meta row (industry /
// HQ / size), hiring badge, short blurb, open-roles count. Every field is
// optional-safe since demo/seed companies don't all have the full profile
// filled in yet (that happens in the employer workspace's Overview tab).
const CompanyCard = ({ company }) => {
  const isVerified = company.verification_status === "verified";
  const isHiring = (company.open_roles || 0) > 0;

  return (
    <Link
      to={`/companies/${company.id}`}
      className="hairline hover-lift group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-surface/60 p-6 transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--border-strong),0_20px_40px_-24px_oklch(0.68_0.19_293/0.45)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-12 w-12 shrink-0 rounded-xl bg-white/5 object-contain p-1.5"
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium group-hover:text-primary">{company.name}</span>
              {isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-label="Verified company" />}
            </div>
            {company.industry && (
              <div className="truncate text-xs text-muted-foreground">{company.industry}</div>
            )}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>

      {(company.headquarters || company.company_size) && (
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {company.headquarters && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {company.headquarters}
            </span>
          )}
          {company.company_size && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {company.company_size} employees
            </span>
          )}
        </div>
      )}

      {company.about && (
        <p className="relative line-clamp-2 text-sm text-muted-foreground">{company.about}</p>
      )}

      <div className="relative mt-auto flex items-center justify-between pt-1">
        <Chip tone={isHiring ? "cyan" : "default"}>{isHiring ? "Hiring Now" : "No open roles"}</Chip>
        {isHiring && (
          <span className="text-xs font-medium text-primary">
            {company.open_roles} open role{company.open_roles === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </Link>
  );
};

export default CompanyCard;

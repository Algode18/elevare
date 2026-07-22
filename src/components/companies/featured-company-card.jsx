import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, MapPin } from "lucide-react";

// Hero-tier card for the Featured Companies strip — brand-gradient backdrop
// (falls back to the site's primary/cyan gradient when a company hasn't set
// brand_color/accent_color yet), bigger logo, short blurb, explicit CTA.
const FeaturedCompanyCard = ({ company, index = 0 }) => {
  const from = company.brand_color || "#7c5cff";
  const to = company.accent_color || "#22d3ee";
  const isHiring = (company.open_roles || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        to={`/companies/${company.id}`}
        className="hover-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/60 p-7"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-25 transition-opacity duration-300 group-hover:opacity-40"
          style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        />
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.07]" />

        <div className="relative flex items-center justify-between">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-14 w-14 rounded-2xl bg-white/5 object-contain p-2 shadow-lg"
            />
          ) : (
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg"
              style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <Building2 className="h-6 w-6" />
            </div>
          )}
          {isHiring && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Hiring Now
            </span>
          )}
        </div>

        <h3 className="relative mt-5 font-display text-2xl">{company.name}</h3>

        {company.headquarters && (
          <div className="relative mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {company.headquarters}
          </div>
        )}

        {company.about && (
          <p className="relative mt-3 line-clamp-2 text-sm text-muted-foreground">{company.about}</p>
        )}

        <div className="relative mt-6 flex items-center justify-between border-t border-border/60 pt-4">
          <span className="text-xs text-muted-foreground">
            {isHiring ? `${company.open_roles} open role${company.open_roles === 1 ? "" : "s"}` : "No open roles"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            View Company <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default FeaturedCompanyCard;

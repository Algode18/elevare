import { useEffect, useMemo, useRef, useState } from "react";
import { City } from "country-state-city";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Fixes a real granularity bug: the old location filter/post-job form both
// used State.getStatesOfCountry("IN"), but job.location values in practice
// are city names ("Bangalore", "Pune") — an exact-match filter against state
// names could never find them. This picks real Indian cities instead, and
// stores just the city name (same format the app already uses), while
// showing "City, State" in the list so same-named cities stay distinguishable.
//
// Built with plain Input + local state — no new dependency (no cmdk/popover
// package in this project yet) — to keep this a drop-in, install-free fix.
const ALL_CITIES = City.getCitiesOfCountry("IN") || [];

function dedupedCities() {
  const seen = new Set();
  const out = [];
  for (const c of ALL_CITIES) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    out.push(c);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const CITIES = dedupedCities();

const CitySelect = ({ value, onChange, placeholder = "Any location", allowClear = true, className = "", icon: Icon = Search, inputClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? CITIES.filter((c) => c.name.toLowerCase().startsWith(q)) : CITIES;
    return list.slice(0, 40);
  }, [query]);

  const handlePick = (cityName) => {
    onChange(cityName);
    setQuery(cityName);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn("h-10 border-none bg-transparent pl-9 pr-8 text-sm", inputClassName)}
        />
        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear location"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="hairline absolute left-0 top-full z-20 mt-1.5 max-h-64 w-64 overflow-y-auto rounded-lg bg-surface p-1 shadow-xl">
          {results.length ? (
            results.map((c) => (
              <button
                key={`${c.name}-${c.stateCode}`}
                type="button"
                onClick={() => handlePick(c.name)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.stateCode}</span>
              </button>
            ))
          ) : (
            <div className="px-2.5 py-3 text-sm text-muted-foreground">No matching city.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySelect;
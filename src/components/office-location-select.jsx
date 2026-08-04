import { useMemo, useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import CitySelect from "@/components/city-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OTHER_VALUE = "__other__";

// Restricts the Location field to a company's own registered offices so a
// recruiter can't fat-finger a city the company doesn't actually operate in.
//
// - offices === undefined  -> still loading, render a disabled placeholder
// - offices is null/[]     -> no offices on file yet, fall back to the free
//                             city search (with a nudge to add one)
// - otherwise              -> dropdown of that company's cities, "Currently
//                             hiring" offices first; an "Other location"
//                             option drops down into free-text for one-off
//                             cases (e.g. a client site that isn't a
//                             registered office yet)
const OfficeLocationSelect = ({
  offices,
  value,
  onChange,
  className = "",
  placeholder = "Select location",
  addOfficeHref = "/employer/company",
}) => {
  const cityOptions = useMemo(() => {
    if (!offices?.length) return [];
    const hiring = offices.filter((o) => o.is_hiring);
    const pool = hiring.length ? hiring : offices;

    const seen = new Set();
    const out = [];
    for (const o of pool) {
      if (!o.city || seen.has(o.city)) continue;
      seen.add(o.city);
      out.push({ city: o.city, isHiring: !!o.is_hiring, isHq: !!o.is_headquarter });
    }
    return out;
  }, [offices]);

  const cityNames = useMemo(() => new Set(cityOptions.map((o) => o.city)), [cityOptions]);

  // If the current value doesn't match any listed office city (e.g. an
  // older job posted before an office existed, or edit-mode data), default
  // to "other" mode so that value is shown rather than silently dropped.
  const [useOther, setUseOther] = useState(() => !!value && !cityNames.has(value));

  useEffect(() => {
    if (offices === undefined) return; // still loading — don't reconcile yet
    if (value && !cityNames.has(value)) setUseOther(true);
    else if (value && cityNames.has(value)) setUseOther(false);
  }, [value, cityNames, offices]);

  if (offices === undefined) {
    return (
      <div className={`h-9 animate-pulse rounded-md border border-input bg-surface-2 ${className}`} />
    );
  }

  if (!cityOptions.length) {
    return (
      <div className={className}>
        <CitySelect value={value} onChange={onChange} placeholder={placeholder} allowClear={false} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {offices?.length
            ? "None of this company's offices are marked \"Currently hiring\" — flip that on in "
            : "No offices added for this company yet — add one in "}
          <a href={addOfficeHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Company Profile → Offices
          </a>{" "}
          for a locked-down location list next time.
        </p>
      </div>
    );
  }

  if (useOther) {
    return (
      <div className={className}>
        <CitySelect value={value} onChange={onChange} placeholder={placeholder} allowClear={false} />
        <button
          type="button"
          onClick={() => {
            setUseOther(false);
            onChange("");
          }}
          className="mt-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Choose from this company's offices instead
        </button>
      </div>
    );
  }

  return (
    <Select
      value={cityNames.has(value) ? value : undefined}
      onValueChange={(v) => {
        if (v === OTHER_VALUE) {
          setUseOther(true);
          onChange("");
        } else {
          onChange(v);
        }
      }}
    >
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder={placeholder}>
          {value ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {value}
            </span>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {cityOptions.map((o) => (
            <SelectItem key={o.city} value={o.city}>
              {o.city}
              {o.isHq ? " · HQ" : ""}
              {o.isHiring ? " · Hiring" : ""}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>Other location (type manually)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default OfficeLocationSelect;
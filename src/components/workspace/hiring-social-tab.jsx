import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarLoader } from "react-spinners";
import { State } from "country-state-city";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { updateCompanyProfile } from "@/api/apiCompanies";

// lucide-react 1.0 removed all brand/logo icons (GitHub, Twitter, LinkedIn,
// Instagram, YouTube, etc.) for trademark reasons — see lucide.dev/guide/version-1.
// These are small inline SVGs instead, so we don't need a new dependency
// (e.g. @icons-pack/react-simple-icons) just for five social glyphs.
const IconLinkedin = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.1 1 2.48 1s2.5 1.12 2.5 2.5zM.24 8.25h4.48V23H.24V8.25zM8.24 8.25h4.29v2.01h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.37 2.99 5.37 6.87V23h-4.48v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V23H8.24V8.25z" />
  </svg>
);
const IconGithub = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A10.99 10.99 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.6 10.2 21 1.75h-1.76l-6.42 7.33-5.13-7.33H1.5l7.76 11.1L1.5 21.5h1.76l6.78-7.74 5.42 7.74h6.19l-8.05-11.3Zm-2.4 2.74-.79-1.1L3.9 3.02h2.7l5.03 7.19.78 1.1 6.54 9.35h-2.7l-5.33-7.62Z" />
  </svg>
);
const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const IconYoutube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" />
  </svg>
);

// Same enums post-job.jsx uses — keeping these in sync is what makes the
// preload actually work when a recruiter opens Post Job.
const WORK_MODES = ["Remote", "On-site", "Hybrid"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const schema = z.object({
  default_currency: z.string().optional().or(z.literal("")),
  default_location: z.string().optional().or(z.literal("")),
  default_work_mode: z.string().optional().or(z.literal("")),
  default_employment_type: z.string().optional().or(z.literal("")),
  default_expiry_days: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  linkedin: z.string().optional().or(z.literal("")),
  github: z.string().optional().or(z.literal("")),
  twitter: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  youtube: z.string().optional().or(z.literal("")),
});

const SocialField = ({ icon: Icon, ...props }) => (
  <div className="flex items-center gap-2">
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
    </div>
    <Input {...props} />
  </div>
);

const HiringSocialTab = ({ company, onUpdated }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      default_currency: company?.default_currency || "INR",
      default_location: company?.default_location || "",
      default_work_mode: company?.default_work_mode || "",
      default_employment_type: company?.default_employment_type || "",
      default_expiry_days: company?.default_expiry_days ?? 30,
      linkedin: company?.linkedin || "",
      github: company?.github || "",
      twitter: company?.twitter || "",
      instagram: company?.instagram || "",
      youtube: company?.youtube || "",
    },
  });

  const { loading: saving, data: saved, fn: fnSave } = useFetch(updateCompanyProfile, {
    company_id: company?.id,
  });

  const onSubmit = (values) => fnSave(values);

  useEffect(() => {
    if (saved) {
      onUpdated?.(saved);
      reset(undefined, { keepValues: true, keepDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {saving && <BarLoader width={"100%"} color="#7c5cff" />}

      <section>
        <h2 className="mb-1 text-sm font-semibold">Hiring Preferences</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Preloads these values every time you post a new job — no need to pick them each time.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Default location</Label>
            <Controller
              name="default_location"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {State.getStatesOfCountry("IN").map(({ name }) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label>Default work mode</Label>
            <Controller
              name="default_work_mode"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {WORK_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label>Default employment type</Label>
            <Controller
              name="default_employment_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label>Default currency</Label>
            <Controller
              name="default_currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label>Default listing length (days)</Label>
            <Input className="mt-1.5" type="number" placeholder="e.g. 30" {...register("default_expiry_days")} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Social Links</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Shown on your public company page. Paste full profile URLs.
        </p>

        <div className="space-y-3">
          <SocialField icon={IconLinkedin} placeholder="https://linkedin.com/company/..." {...register("linkedin")} />
          <SocialField icon={IconGithub} placeholder="https://github.com/..." {...register("github")} />
          <SocialField icon={IconX} placeholder="https://x.com/..." {...register("twitter")} />
          <SocialField icon={IconInstagram} placeholder="https://instagram.com/..." {...register("instagram")} />
          <SocialField icon={IconYoutube} placeholder="https://youtube.com/@..." {...register("youtube")} />
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-border/60 pt-5">
        <Button type="submit" disabled={saving || !isDirty}>
          Save changes
        </Button>
        {saved && !isDirty && <span className="text-xs text-muted-foreground">Saved.</span>}
      </div>
    </form>
  );
};

export default HiringSocialTab;
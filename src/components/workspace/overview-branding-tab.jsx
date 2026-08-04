import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarLoader } from "react-spinners";
import { ImagePlus, Upload } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { updateCompanyProfile, uploadCompanyAsset } from "@/api/apiCompanies";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const INDUSTRIES = [
  "IT Services & Consulting",
  "Software & Internet",
  "Enterprise Technology & IT Services",
  "Fintech",
  "Financial Services & Banking",
  "Insurance",
  "E-commerce & Retail",
  "Healthcare & Life Sciences",
  "Pharmaceuticals & Biotechnology",
  "Manufacturing",
  "Automotive",
  "Aerospace & Defense",
  "Energy & Utilities",
  "Oil & Gas",
  "Telecommunications",
  "Media & Entertainment",
  "Gaming",
  "Education & EdTech",
  "Professional Services & Consulting",
  "Real Estate & PropTech",
  "Construction & Engineering",
  "Logistics & Supply Chain",
  "Travel & Hospitality",
  "Food & Beverage",
  "Agriculture & AgTech",
  "Non-profit & NGO",
  "Government & Public Sector",
  "Legal Services",
  "Human Resources & Staffing",
  "Marketing & Advertising",
  "Cybersecurity",
  "Semiconductors & Hardware",
  "Other",
];

const schema = z.object({
  industry: z.string().optional().or(z.literal("")),
  founded_year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  company_size: z.string().optional().or(z.literal("")),
  headquarters: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//.test(v), {
      message: "Include http:// or https://",
    }),
  about: z.string().optional().or(z.literal("")),
  mission: z.string().optional().or(z.literal("")),
  vision: z.string().optional().or(z.literal("")),
  brand_color: z.string().optional().or(z.literal("")),
  accent_color: z.string().optional().or(z.literal("")),
});

const OverviewBrandingTab = ({ company, onUpdated }) => {
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [isOtherIndustry, setIsOtherIndustry] = useState(
    !!company?.industry && !INDUSTRIES.slice(0, -1).includes(company.industry)
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      industry: company?.industry || "",
      founded_year: company?.founded_year ?? "",
      company_size: company?.company_size || "",
      headquarters: company?.headquarters || "",
      website: company?.website || "",
      about: company?.about || "",
      mission: company?.mission || "",
      vision: company?.vision || "",
      brand_color: company?.brand_color || "#6F56F8",
      accent_color: company?.accent_color || "#4F8EF7",
    },
  });

  const { loading: saving, data: saved, fn: fnSave } = useFetch(updateCompanyProfile, {
    company_id: company?.id,
  });
  const { loading: uploading, data: uploaded, fn: fnUpload } = useFetch(uploadCompanyAsset, {});

  const onSubmit = (values) => {
    fnSave(values);
  };

  useEffect(() => {
    if (saved) {
      onUpdated?.(saved);
      reset(undefined, { keepValues: true, keepDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  useEffect(() => {
    if (uploaded) onUpdated?.(uploaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaded]);

  const handleAssetPick = (kind) => (e) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;
    fnUpload({ company_id: company.id, file, kind });
    e.target.value = "";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {(saving || uploading) && <BarLoader width={"100%"} color="var(--primary)" />}

      {/* Branding — logo / banner upload */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Branding</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Shown on your public company page and every job listing.
        </p>

        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto sm:gap-4">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="" className="h-12 w-12 rounded-lg border border-border object-contain sm:h-14 sm:w-14" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg border border-dashed border-border text-muted-foreground sm:h-14 sm:w-14">
                <ImagePlus className="h-5 w-5" />
              </div>
            )}
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleAssetPick("logo")}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Logo
              </Button>
            </div>
          </div>

         <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {company?.banner_url ? (
              <img src={company.banner_url} alt="" className="h-12 w-20 rounded-lg border border-border object-cover sm:h-14 sm:w-24" />
            ) : (
              <div className="grid h-12 w-20 place-items-center rounded-lg border border-dashed border-border text-muted-foreground sm:h-14 sm:w-24">
                <ImagePlus className="h-5 w-5" />
              </div>
            )}
            <div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleAssetPick("banner")}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => bannerInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Banner
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Brand color</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" className="h-9 w-10 shrink-0 rounded border border-border bg-transparent" {...register("brand_color")} />
              <Input {...register("brand_color")} placeholder="#6F56F8" />
            </div>
          </div>
          <div>
            <Label>Accent color</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" className="h-9 w-10 shrink-0 rounded border border-border bg-transparent" {...register("accent_color")} />
              <Input {...register("accent_color")} placeholder="#4F8EF7" />
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Overview</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          The basics candidates see first on your company page.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Industry</Label>
            <Controller
              name="industry"
              control={control}
              render={({ field }) => (
                <>
                  <Select
                    value={isOtherIndustry ? "Other" : field.value || ""}
                    onValueChange={(val) => {
                      if (val === "Other") {
                        setIsOtherIndustry(true);
                        field.onChange("");
                      } else {
                        setIsOtherIndustry(false);
                        field.onChange(val);
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isOtherIndustry && (
                    <Input
                      className="mt-2"
                      placeholder="Enter your industry"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                </>
              )}
            />
          </div>
          <div>
            <Label>Founded year</Label>
            <Input className="mt-1.5" type="number" placeholder="e.g. 2019" {...register("founded_year")} />
          </div>
          <div>
            <Label>Company size</Label>
            <Controller
              name="company_size"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s} employees
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Headquarters</Label>
            <Input className="mt-1.5" placeholder="e.g. Bengaluru, India" {...register("headquarters")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Website</Label>
            <Input className="mt-1.5" placeholder="https://yourcompany.com" {...register("website")} />
            {errors.website && <p className="mt-1 text-xs text-destructive">{errors.website.message}</p>}
          </div>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">About</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Longer-form context — shown further down the company page.
        </p>

        <div className="space-y-4">
          <div>
            <Label>About the company</Label>
            <Textarea className="mt-1.5" rows={4} placeholder="What does your company do?" {...register("about")} />
          </div>
          <div>
            <Label>Mission</Label>
            <Textarea className="mt-1.5" rows={2} placeholder="Why does the company exist?" {...register("mission")} />
          </div>
          <div>
            <Label>Vision</Label>
            <Textarea className="mt-1.5" rows={2} placeholder="Where is the company headed?" {...register("vision")} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
        <Button type="submit" disabled={saving || !isDirty}>
          Save changes
        </Button>
        {saved && !isDirty && <span className="text-xs text-muted-foreground">Saved.</span>}
      </div>
    </form>
  );
};

export default OverviewBrandingTab;
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Link2, ShieldCheck, AlertTriangle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/elevare-primitives";
import useFetch from "@/hooks/use-fetch";
import { updateCompanyProfile, deleteCompany } from "@/api/apiCompanies";

const schema = z.object({
  slug: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[a-z0-9-]+$/.test(v), {
      message: "Lowercase letters, numbers, and hyphens only",
    }),
});

const VERIFICATION_TONE = { verified: "cyan", pending: "warn", rejected: "danger" };
const VERIFICATION_COPY = {
  verified: "Your company is verified and shows a verified badge to candidates.",
  pending: "Verification requests are reviewed by the Elevare team — check back soon.",
  rejected: "Your last verification request wasn't approved. You can submit a new request below.",
  unverified: "Get a verified badge on your company page to build trust with candidates.",
};

const SettingsTab = ({ company, onUpdated }) => {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { slug: company?.slug || "" },
  });

  const { loading, data: saved, error, fn: fnSave } = useFetch(updateCompanyProfile, {
    company_id: company?.id,
  });

  const {
    loading: requesting,
    data: verificationSaved,
    error: verificationError,
    fn: fnRequestVerification,
  } = useFetch(updateCompanyProfile, {
    company_id: company?.id,
  });

  const {
    loading: deleting,
    error: deleteError,
    fn: fnDelete,
  } = useFetch(deleteCompany, { company_id: company?.id });

  const onSubmit = (values) => {
    fnSave({ slug: values.slug || null });
  };

  useEffect(() => {
    if (saved) {
      onUpdated?.(saved);
      reset({ slug: saved.slug || "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  useEffect(() => {
    if (verificationSaved) {
      onUpdated?.(verificationSaved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationSaved]);

  const requestVerification = () => {
    fnRequestVerification({ verification_status: "pending" });
  };

  const slugTaken = error?.code === "23505" || /duplicate key/i.test(error?.message || "");

  const deleteMatch = confirmText.trim() === (company?.name || "");

  const handleDelete = async () => {
    if (!deleteMatch) return;
    await fnDelete();
    navigate("/employer/company");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold">Public Career Page</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          A pretty, memorable URL for your company page. Leave blank to keep using the numeric ID.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
          <Label>Slug</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" /> /companies/
            </div>
            <Input placeholder="your-company-name" {...register("slug")} />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          {slugTaken && <p className="mt-1 text-xs text-destructive">That slug is already taken.</p>}
          {loading && <BarLoader className="mt-3" width={"100%"} color="var(--primary)" />}
          <Button type="submit" size="sm" className="mt-3" disabled={loading || !isDirty}>
            Save
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Verification</h2>
        <div className="hairline mt-3 flex items-start gap-3 rounded-lg bg-surface-2/40 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <Chip tone={VERIFICATION_TONE[company?.verification_status] || "default"}>
              {company?.verification_status || "unverified"}
            </Chip>
            <p className="mt-2 text-xs text-muted-foreground">
              {VERIFICATION_COPY[company?.verification_status] || VERIFICATION_COPY.unverified}
            </p>

            {(!company?.verification_status || company.verification_status === "rejected") && (
              <>
                {requesting && <BarLoader className="mt-3" width={"100%"} color="var(--primary)" />}
                {verificationError && (
                  <p className="mt-2 text-xs text-destructive">
                    {verificationError.message || "Couldn't submit your request. Please try again."}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  disabled={requesting}
                  onClick={requestVerification}
                >
                  {company?.verification_status === "rejected"
                    ? "Request verification again"
                    : "Request Verification"}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-destructive">Danger Zone</h2>
        <div className="hairline mt-3 space-y-4 rounded-lg border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-xs text-muted-foreground">
              Deleting <span className="font-medium text-foreground">{company?.name}</span> permanently removes
              its profile, offices, team members, job postings, and every application tied to those jobs. This
              can't be undone.
            </div>
          </div>

          <div className="max-w-md">
            <Label className="text-xs">
              Type <span className="font-mono font-medium text-foreground">{company?.name}</span> to confirm
            </Label>
            <Input
              className="mt-1.5"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={company?.name}
              autoComplete="off"
            />
          </div>

          {deleteError && (
            <p className="text-xs text-destructive">
              {deleteError.message || "Something went wrong deleting the company. Please try again."}
            </p>
          )}

          {deleting && <BarLoader width={"100%"} color="var(--primary)" />}

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!deleteMatch || deleting}
            onClick={handleDelete}
          >
            Delete company
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
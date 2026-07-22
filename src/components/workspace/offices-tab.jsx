import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarLoader } from "react-spinners";
import { MapPin, Plus, Pencil, Trash2, Building2, Star } from "lucide-react";

import {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import {
  getCompanyOffices,
  addCompanyOffice,
  updateCompanyOffice,
  deleteCompanyOffice,
} from "@/api/apiCompanies";

const schema = z.object({
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  employees: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  is_headquarter: z.boolean().default(false),
  is_hiring: z.boolean().default(false),
});

const ToggleField = ({ label, value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={cn(
      "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
      value ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-transparent text-muted-foreground"
    )}
  >
    {label}
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
        value ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      {value && <div className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
    </span>
  </button>
);

const OfficeDrawer = ({ companyId, office, onSaved, trigger }) => {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(office?.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      city: office?.city || "",
      state: office?.state || "",
      country: office?.country || "",
      address: office?.address || "",
      timezone: office?.timezone || "",
      employees: office?.employees ?? "",
      is_headquarter: office?.is_headquarter || false,
      is_hiring: office?.is_hiring || false,
    },
  });

  const { loading, data, fn } = useFetch(
    isEdit ? updateCompanyOffice : addCompanyOffice,
    isEdit ? { office_id: office.id } : { company_id: companyId }
  );

  const onSubmit = (values) => fn(values);

  useEffect(() => {
    if (data) {
      onSaved?.();
      setOpen(false);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> {isEdit ? "Edit office" : "Add office"}
          </DrawerTitle>
          <DrawerDescription>
            {isEdit ? "Update this location's details." : "Add a location candidates will see on your company page."}
          </DrawerDescription>
        </DrawerHeader>

        <form className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-4 pb-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <Input className="mt-1.5" placeholder="e.g. Bhubaneswar" {...register("city")} />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div>
              <Label>State</Label>
              <Input className="mt-1.5" placeholder="e.g. Odisha" {...register("state")} />
            </div>
            <div>
              <Label>Country</Label>
              <Input className="mt-1.5" placeholder="e.g. India" {...register("country")} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input className="mt-1.5" placeholder="e.g. Asia/Kolkata" {...register("timezone")} />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input className="mt-1.5" placeholder="Street address (optional)" {...register("address")} />
          </div>

          <div>
            <Label>Employees at this office</Label>
            <Input className="mt-1.5" type="number" placeholder="e.g. 25" {...register("employees")} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Controller
              name="is_headquarter"
              control={control}
              render={({ field }) => (
                <ToggleField label="Headquarters" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name="is_hiring"
              control={control}
              render={({ field }) => (
                <ToggleField label="Actively hiring here" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {loading && <BarLoader width={"100%"} color="#7c5cff" />}
        </form>

        <DrawerFooter>
          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={loading}>
            {isEdit ? "Save changes" : "Add office"}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const OfficesTab = ({ company }) => {
  const { data: offices, loading, fn: fnOffices } = useFetch(getCompanyOffices, {
    company_id: company?.id,
  });
  const { fn: fnDelete } = useFetch(deleteCompanyOffice);

  useEffect(() => {
    if (company?.id) fnOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const handleDelete = async (officeId) => {
    if (!window.confirm("Remove this office? This can't be undone.")) return;
    await fnDelete({ office_id: officeId });
    fnOffices();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Offices</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Locations shown on your public company page.
          </p>
        </div>
        <OfficeDrawer
          companyId={company?.id}
          onSaved={fnOffices}
          trigger={
            <Button type="button" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add office
            </Button>
          }
        />
      </div>

      {loading !== false && <BarLoader width={"100%"} color="#7c5cff" />}

      {loading === false && (
        <div className="space-y-2.5">
          {offices?.length ? (
            offices.map((o) => (
              <div
                key={o.id}
                className="hairline flex items-start justify-between gap-4 rounded-lg bg-surface-2/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {o.city}
                      {o.state ? `, ${o.state}` : ""}
                      {o.is_headquarter && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Star className="h-2.5 w-2.5 fill-current" /> HQ
                        </span>
                      )}
                      {o.is_hiring && (
                        <span className="rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-medium text-lime">
                          Hiring
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[o.country, o.timezone].filter(Boolean).join(" • ") || "—"}
                      {o.employees ? ` • ${o.employees} employees` : ""}
                    </div>
                    {o.address && <div className="mt-1 text-xs text-muted-foreground">{o.address}</div>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <OfficeDrawer
                    companyId={company?.id}
                    office={o}
                    onSaved={fnOffices}
                    trigger={
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(o.id)}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No offices added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficesTab;
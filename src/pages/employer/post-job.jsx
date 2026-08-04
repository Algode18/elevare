import { getMyCompanies, getCompanyOffices } from "@/api/apiCompanies";
import { addNewJob, getSingleJob, updateJob } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/add-company-drawer";
import BackButton from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { useResolvedTheme } from "@/components/theme-provider";
import OfficeLocationSelect from "@/components/office-location-select";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import {
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Save,
  Sparkles,
  MapPinIcon,
  IndianRupee,
  CalendarClock,
} from "lucide-react";

function buildSchema(originalExpiresAt) {
  return z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    location: z.string().min(1, { message: "Select a location" }),
    company_id: z.string().min(1, { message: "Select or Add a new Company" }),
    requirements: z.string().min(1, { message: "Requirements are required" }),
    skills: z.array(z.string()).optional(),
    job_type: z.enum(["Full-time", "Part-time", "Internship", "Contract"], {
      message: "Select a job type",
    }),
    work_mode: z.enum(["Remote", "On-site", "Hybrid"], {
      message: "Select a work mode",
    }),
    duration: z.string().optional(),
    salary_min: z.string().optional(),
    salary_max: z.string().optional(),
    salary_currency: z.string().optional(),
    salary_period: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
    expires_at: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          if (originalExpiresAt && val === originalExpiresAt) return true; // untouched existing deadline
          return new Date(val).getTime() > Date.now();
        },
        { message: "Deadline must be in the future" }
      ),
  });
}

const defaultValues = {
  title: "",
  description: "",
  location: "",
  company_id: "",
  requirements: "",
  skills: [],
  job_type: undefined,
  work_mode: undefined,
  duration: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "INR",
  salary_period: "Yearly",
  benefits: [],
  hashtags: [],
  expires_at: "",
};

const CURRENCY_SYMBOL = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
const PERIOD_LABEL = { Yearly: "year", Monthly: "month", Hourly: "hour" };

function formatSalaryRange({ salary_min, salary_max, salary_currency, salary_period }) {
  if (!salary_min && !salary_max) return null;
  const symbol = CURRENCY_SYMBOL[salary_currency] || "";
  const period = PERIOD_LABEL[salary_period] || "";
  const fmt = (n) => Number(n).toLocaleString("en-IN");
  if (salary_min && salary_max) {
    return `${symbol}${fmt(salary_min)} - ${symbol}${fmt(salary_max)} / ${period}`;
  }
  return `${symbol}${fmt(salary_min || salary_max)} / ${period}`;
}

function timeAgoShort(ts) {
  if (!ts) return null;
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "Saved just now";
  if (diff < 60) return `Saved ${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `Saved ${mins}m ago`;
  return "Saved";
}

// ---- Small building blocks kept local to this page ----------------------

const SectionCard = ({ title, description, children }) => (
  <div className="hairline rounded-xl bg-surface p-5 sm:p-6">
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

const FieldLabel = ({ children, hint }) => (
  <label className="flex items-baseline justify-between text-sm font-medium">
    <span>{children}</span>
    {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
  </label>
);

const RadioCards = ({ options, value, onChange, className }) => (
  <div className={cn("grid gap-2", className)}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
          value === opt.value
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const ChipInput = ({ value = [], onChange, placeholder }) => {
  const [text, setText] = useState("");

  const addChip = () => {
    const v = text.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setText("");
  };

  const removeChip = (chip) => onChange(value.filter((c) => c !== chip));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-2 focus-within:ring-2 focus-within:ring-ring/50">
      {value.map((chip) => (
        <span
          key={chip}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {chip}
          <button type="button" onClick={() => removeChip(chip)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addChip}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[140px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------

const PostJobPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const resolvedTheme = useResolvedTheme();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const draftKey = user && !isEditMode ? `elevare:draft:post-job:${user.id}` : null;
  const [lastSaved, setLastSaved] = useState(null);
  const [, forceTick] = useState(0);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const saveTimer = useRef(null);
  const hasHydrated = useRef(false);

  // Load the existing job when editing. Declared before useForm so we can
  // build a schema that knows the job's original deadline (see below).
  const {
    loading: loadingJobToEdit,
    data: jobToEdit,
    fn: fnJobToEdit,
  } = useFetch(getSingleJob, { job_id: editId });
  const hasFetchedEdit = useRef(false);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (isEditMode && !hasFetchedEdit.current) {
      hasFetchedEdit.current = true;
      fnJobToEdit().finally(() => {
        fetchAttempted.current = true;
        forceTick((t) => t + 1);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const originalExpiresAt = jobToEdit?.expires_at ? jobToEdit.expires_at.split("T")[0] : null;
  const schema = useMemo(() => buildSchema(originalExpiresAt), [originalExpiresAt]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Guarded so this only ever runs once — otherwise anything that causes
    // jobToEdit to update again (e.g. a re-fetch) would call reset() a second
    // time and silently wipe out whatever the user had already changed.
    if (!jobToEdit || hasHydrated.current) return;
    reset({
      ...defaultValues,
      ...jobToEdit,
      title: jobToEdit.title ?? "",
      description: jobToEdit.description ?? "",
      location: jobToEdit.location ?? "",
      requirements: jobToEdit.requirements ?? "",
      company_id: jobToEdit.company_id != null ? String(jobToEdit.company_id) : "",
      skills: jobToEdit.skills || [],
      benefits: jobToEdit.benefits || [],
      hashtags: jobToEdit.hashtags || [],
      duration: jobToEdit.duration ?? "",
      salary_currency: jobToEdit.salary_currency ?? "",
      salary_period: jobToEdit.salary_period ?? "",
      salary_min: jobToEdit.salary_min != null ? String(jobToEdit.salary_min) : "",
      salary_max: jobToEdit.salary_max != null ? String(jobToEdit.salary_max) : "",
      expires_at: jobToEdit.expires_at ? jobToEdit.expires_at.split("T")[0] : "",
    });
    hasHydrated.current = true; // don't let the local-draft effect below clobber this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobToEdit]);

  // Restore a local draft once, on first mount, if one exists for this user.
  // Skipped entirely in edit mode — see prefill effect above instead.
  useEffect(() => {
    if (!draftKey || hasHydrated.current) return;
    hasHydrated.current = true;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const { values, savedAt } = JSON.parse(raw);
        reset({ ...defaultValues, ...values });
        setLastSaved(savedAt || null);
      }
    } catch {
      // Corrupt or missing draft — ignore and start fresh.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Autosave to localStorage, debounced, on every field change.
  const watched = watch();
  useEffect(() => {
    if (!draftKey || !hasHydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const savedAt = Date.now();
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ values: getValues(), savedAt })
      );
      setLastSaved(savedAt);
    }, 800);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched), draftKey]);

  // Tick the "Saved Xs ago" label forward every few seconds.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const handleSaveDraft = () => {
    if (!draftKey) return;
    const savedAt = Date.now();
    window.localStorage.setItem(draftKey, JSON.stringify({ values: getValues(), savedAt }));
    setLastSaved(savedAt);
  };

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const {
    loading: loadingUpdateJob,
    error: errorUpdateJob,
    data: dataUpdateJob,
    fn: fnUpdateJob,
  } = useFetch(updateJob, { job_id: editId });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      skills: data.skills || [],
      benefits: data.benefits || [],
      hashtags: data.hashtags || [],
      duration: data.duration || null,
      salary_range: formatSalaryRange(data),
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
    };

    if (isEditMode) {
      fnUpdateJob(payload);
    } else {
      fnCreateJob({ ...payload, recruiter_id: user.id, isOpen: true });
    }
  };

  const [invalidFormMessage, setInvalidFormMessage] = useState(null);
  const onInvalid = (formErrors) => {
    const first = Object.values(formErrors)[0];
    setInvalidFormMessage(first?.message || "Please fix the highlighted fields before saving.");
  };

  const loadingSubmit = isEditMode ? loadingUpdateJob : loadingCreateJob;
  const errorSubmit = isEditMode ? errorUpdateJob : errorCreateJob;

  useEffect(() => {
    if (dataCreateJob?.length > 0 || dataUpdateJob?.length > 0) {
      setInvalidFormMessage(null);
      if (draftKey) window.localStorage.removeItem(draftKey);
      navigate("/employer/jobs");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCreateJob, loadingUpdateJob]);

  const {
    loading: loadingCompanies,
    data: companies,
    fn: fnCompanies,
  } = useFetch(getMyCompanies, { owner_id: user?.id });

  useEffect(() => {
    if (isLoaded) fnCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const jobType = watch("job_type");
  const selectedCompany = companies?.find((c) => String(c.id) === String(watched.company_id));
  const salaryPreview = formatSalaryRange(watched);

  // Location is restricted to the selected company's own registered offices
  // (see OfficeLocationSelect) so a recruiter can't pick a city the company
  // doesn't actually operate in. Refetch every time the company changes.
  const { data: offices, fn: fnOffices } = useFetch(getCompanyOffices, {
    company_id: selectedCompany?.id,
  });

  useEffect(() => {
    if (selectedCompany?.id) fnOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  // Preload the company's saved Hiring Preferences (Company Profile → Hiring &
  // Social) whenever a company is picked on a NEW job. This never fires during
  // edit-mode hydration (that path uses reset(), not this handler), and it
  // never overwrites a field the user has already touched by hand.
  const handleCompanyChange = (value) => {
    setValue("company_id", value, { shouldDirty: true, shouldValidate: true });
    if (isEditMode) return;

    const company = companies?.find((c) => String(c.id) === String(value));
    if (!company) return;

    if (!dirtyFields.location && company.default_location) {
      setValue("location", company.default_location, { shouldDirty: false, shouldValidate: true });
    }
    if (!dirtyFields.work_mode && company.default_work_mode) {
      setValue("work_mode", company.default_work_mode, { shouldDirty: false, shouldValidate: true });
    }
    if (!dirtyFields.job_type && company.default_employment_type) {
      setValue("job_type", company.default_employment_type, { shouldDirty: false, shouldValidate: true });
    }
    if (!dirtyFields.salary_currency && company.default_currency) {
      setValue("salary_currency", company.default_currency, { shouldDirty: false });
    }
  };

  // Lightweight completion + live validation, computed from current values.
  const progress = useMemo(() => {
    const checks = [
      watched.title,
      watched.description,
      watched.location,
      watched.company_id,
      watched.job_type,
      watched.work_mode,
      watched.requirements,
      watched.skills?.length > 0,
      watched.salary_min && watched.salary_max,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [watched]);

  const validation = useMemo(
    () => [
      {
        ok: (watched.description || "").length > 40,
        label: (watched.description || "").length > 40 ? "Description looks good" : "Description is a bit short",
      },
      {
        ok: Boolean(watched.salary_min && watched.salary_max),
        label: watched.salary_min && watched.salary_max ? "Salary included" : "No salary added",
      },
      {
        ok: watched.skills?.length > 0,
        label: watched.skills?.length > 0 ? "Skills added" : "No skills added yet",
      },
      {
        ok: Boolean(watched.expires_at),
        label: watched.expires_at ? "Deadline set" : "No application deadline",
      },
    ],
    [watched]
  );

  if (!isLoaded || loadingCompanies || (isEditMode && loadingJobToEdit && !jobToEdit)) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/dashboard" />;
  }

  if (isEditMode && fetchAttempted.current && !jobToEdit) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium">This job couldn't be found.</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or you may not have access to edit it.
        </p>
        <Button variant="outline" onClick={() => navigate("/employer/jobs")}>
          Back to Manage Jobs
        </Button>
      </div>
    );
  }

  const livePreview = (
    <div className="hairline rounded-xl bg-surface p-5">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Eye className="h-3.5 w-3.5" /> Live Preview
      </div>
      <div className="flex items-start gap-3">
        {selectedCompany?.logo_url ? (
          <img
            src={selectedCompany.logo_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md bg-surface-2 object-contain p-1"
          />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-primary to-cyan" />
        )}
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{watched.title || "Job title"}</div>
          <div className="truncate text-sm text-muted-foreground">
            {selectedCompany?.name || "Company"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {watched.location && (
          <span className="flex items-center gap-1">
            <MapPinIcon className="h-3 w-3" /> {watched.location}
          </span>
        )}
        {salaryPreview && (
          <span className="flex items-center gap-1">
            <IndianRupee className="h-3 w-3" /> {salaryPreview}
          </span>
        )}
        {watched.job_type && <span className="rounded-full bg-surface-2 px-2 py-0.5">{watched.job_type}</span>}
        {watched.work_mode && <span className="rounded-full bg-surface-2 px-2 py-0.5">{watched.work_mode}</span>}
      </div>

      {watched.expires_at && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3 w-3" /> Applications close {watched.expires_at}
        </div>
      )}

      {watched.description && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{watched.description}</p>
      )}

      {watched.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {watched.skills.map((s) => (
            <span key={s} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      )}

      {watched.benefits?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {watched.benefits.map((b) => (
            <span key={b} className="rounded-full bg-lime/10 px-2 py-0.5 text-xs text-lime">
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <div>
        <BackButton
          fallbackTo={isEditMode ? "/employer/jobs" : "/employer/dashboard"}
          label={isEditMode ? "Back to Manage Jobs" : "Back to Dashboard"}
        />
        <h1 className="font-display text-3xl sm:text-4xl">
          {isEditMode ? "Edit Job Posting" : "Create a New Opportunity"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isEditMode
            ? "Update the details below and save your changes."
            : (
              <>
                Publish a professional job listing and start receiving applications in minutes.{" "}
                <span className="text-xs">· Estimated time: 3 minutes</span>
              </>
            )}
        </p>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-mono text-muted-foreground">{progress}% Complete</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-5">
          <SectionCard title="Basic Information">
            <div>
              <FieldLabel>Job Title</FieldLabel>
              <Input className="mt-1.5" placeholder="e.g. Senior Backend Developer" {...register("title")} />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Company</FieldLabel>
                <div className="mt-1.5 flex gap-2">
                  <Controller
                    name="company_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={handleCompanyChange}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select company">
                            {field.value
                              ? companies?.find((com) => com.id === Number(field.value))?.name
                              : "Select company"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {companies?.map(({ name, id }) => (
                              <SelectItem key={name} value={id}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <AddCompanyDrawer fetchCompanies={fnCompanies} />
                </div>
                {errors.company_id && (
                  <p className="mt-1 text-xs text-destructive">{errors.company_id.message}</p>
                )}
              </div>

              <div>
                <FieldLabel>Location</FieldLabel>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) =>
                    selectedCompany ? (
                      <OfficeLocationSelect
                        offices={offices}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Job location"
                        className="mt-1.5"
                        addOfficeHref={`/employer/company/${selectedCompany.id}/workspace?tab=offices`}
                      />
                    ) : (
                      <div
                        className="mt-1.5 flex h-9 items-center rounded-md border border-input bg-surface-2 px-3 text-sm text-muted-foreground"
                        title="Select a company first"
                      >
                        Select a company first
                      </div>
                    )
                  }
                />
                {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>}
              </div>
            </div>

            <div>
              <FieldLabel>Employment Type</FieldLabel>
              <Controller
                name="job_type"
                control={control}
                render={({ field }) => (
                  <RadioCards
                    className="mt-1.5 grid-cols-2 sm:grid-cols-4"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "Full-time", label: "Full-time" },
                      { value: "Part-time", label: "Part-time" },
                      { value: "Internship", label: "Internship" },
                      { value: "Contract", label: "Contract" },
                    ]}
                  />
                )}
              />
              {errors.job_type && <p className="mt-1 text-xs text-destructive">{errors.job_type.message}</p>}
            </div>

            <div>
              <FieldLabel>Work Mode</FieldLabel>
              <Controller
                name="work_mode"
                control={control}
                render={({ field }) => (
                  <RadioCards
                    className="mt-1.5 grid-cols-3"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "Remote", label: "Remote" },
                      { value: "On-site", label: "On-site" },
                      { value: "Hybrid", label: "Hybrid" },
                    ]}
                  />
                )}
              />
              {errors.work_mode && <p className="mt-1 text-xs text-destructive">{errors.work_mode.message}</p>}
            </div>

            {jobType === "Internship" && (
              <div>
                <FieldLabel>Duration</FieldLabel>
                <Input className="mt-1.5" placeholder="e.g. 2–6 Months" {...register("duration")} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Role Details">
            <div>
              <FieldLabel>Job Description</FieldLabel>
              <Textarea
                className="mt-1.5"
                placeholder="Give candidates a quick summary of the role and team."
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div>
              <FieldLabel>Required Skills</FieldLabel>
              <div className="mt-1.5">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type a skill and press Enter (e.g. React)"
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <FieldLabel hint="Responsibilities, requirements, nice-to-haves">
                Requirements
              </FieldLabel>
              <div className="mt-1.5">
                <Controller
                  name="requirements"
                  control={control}
                  render={({ field }) => (
                    <MDEditor value={field.value} onChange={field.onChange} data-color-mode={resolvedTheme} />
                  )}
                />
              </div>
              {errors.requirements && (
                <p className="mt-1 text-xs text-destructive">{errors.requirements.message}</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Compensation & Benefits">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-1">
                <FieldLabel>Minimum</FieldLabel>
                <Input className="mt-1.5" type="number" placeholder="80000" {...register("salary_min")} />
              </div>
              <div className="sm:col-span-1">
                <FieldLabel>Maximum</FieldLabel>
                <Input className="mt-1.5" type="number" placeholder="120000" {...register("salary_max")} />
              </div>
              <div className="sm:col-span-1">
                <FieldLabel>Currency</FieldLabel>
                <Controller
                  name="salary_currency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="sm:col-span-1">
                <FieldLabel>Period</FieldLabel>
                <Controller
                  name="salary_period"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Benefits</FieldLabel>
              <div className="mt-1.5">
                <Controller
                  name="benefits"
                  control={control}
                  render={({ field }) => (
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g. Health Insurance, ESOP, Flexible Hours"
                    />
                  )}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Application Settings">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <FieldLabel hint="Optional">Deadline</FieldLabel>
                <Input
                  className="mt-1.5"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...register("expires_at")}
                />
                {errors.expires_at && (
                  <p className="mt-1 text-xs text-destructive">{errors.expires_at.message}</p>
                )}
                {!watched.expires_at && (
                  <p className="mt-1 text-xs text-muted-foreground">No deadline — job stays open until closed.</p>
                )}
              </div>

              <div className="min-w-0">
                <FieldLabel hint="Optional">Hashtags</FieldLabel>
                <div className="mt-1.5">
                  <Controller
                    name="hashtags"
                    control={control}
                    render={({ field }) => (
                      <ChipInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. Hiring, React, Internship"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Live validation */}
          <div className="hairline rounded-xl bg-surface p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Listing Checklist
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {validation.map((v) => (
                <div key={v.label} className="flex items-center gap-2 text-sm">
                  {v.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-lime" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                  )}
                  <span className={v.ok ? "text-foreground" : "text-muted-foreground"}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile-only preview (desktop sees the sticky aside) */}
          {mobilePreviewOpen && <div className="lg:hidden">{livePreview}</div>}

          {invalidFormMessage && (
            <p className="text-sm text-destructive">{invalidFormMessage}</p>
          )}
          {errorSubmit?.message && <p className="text-sm text-destructive">{errorSubmit.message}</p>}
          {loadingSubmit && <BarLoader width={"100%"} color="var(--primary)" />}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
            {!isEditMode && (
              <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save Draft
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="gap-1.5 lg:hidden"
              onClick={() => setMobilePreviewOpen((v) => !v)}
            >
              <Eye className="h-3.5 w-3.5" /> {mobilePreviewOpen ? "Hide Preview" : "Preview"}
            </Button>
            <Button type="submit" size="lg" className="ml-auto" disabled={loadingSubmit}>
              {isEditMode ? "Save Changes" : "Publish Job"}
            </Button>
            {lastSaved && !isEditMode && (
              <span className="w-full text-xs text-muted-foreground sm:w-auto sm:ml-3">
                {timeAgoShort(lastSaved)}
              </span>
            )}
          </div>
        </form>

        {/* Sticky live preview — desktop only */}
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:h-fit">{livePreview}</aside>
      </div>
    </div>
  );
};

export default PostJobPage;
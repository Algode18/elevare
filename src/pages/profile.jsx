import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { State } from "country-state-city";
import { BarLoader } from "react-spinners";
import {
  CheckCircle2,
  FileText,
  UploadCloud,
  X,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Sparkles,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import useProfile from "@/hooks/use-profile";
import { upsertProfile, uploadProfileResume } from "@/api/apiProfiles";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(1, { message: "Full name is required" }),
  headline: z.string().optional(),
  location: z.string().min(1, { message: "Select a location" }),
  phone: z.string().optional(),
  experience_years: z
    .number({ invalid_type_error: "Enter years of experience" })
    .min(0, { message: "Must be 0 or more" })
    .int(),
  education: z.enum(["Intermediate", "Graduate", "Post Graduate"], {
    message: "Select your education level",
  }),
});

const SUGGESTED_SKILLS = [
  "React", "Node.js", "JavaScript", "TypeScript", "Java",
  "Python", "MongoDB", "PostgreSQL", "Tailwind CSS", "Git",
];

const STEPS = [
  { key: "basics", label: "Basics", icon: User },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "skills", label: "Skills", icon: Sparkles },
  { key: "resume", label: "Resume", icon: FileText },
  { key: "review", label: "Review", icon: CheckCircle2 },
];

const EDUCATION_OPTIONS = ["Intermediate", "Graduate", "Post Graduate"];

const ProfilePage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  const { profile, loading: loadingProfile, isComplete, refetch } = useProfile();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      headline: "",
      location: "",
      phone: "",
      experience_years: 0,
    },
  });

  useEffect(() => {
    if (!isLoaded) return;
    reset({
      full_name: profile?.full_name || user?.fullName || "",
      headline: profile?.headline || "",
      location: profile?.location || "",
      phone: profile?.phone || "",
      experience_years: profile?.experience_years ?? 0,
      education: profile?.education || undefined,
    });
    setSkills(profile?.skills || []);
  }, [isLoaded, profile]);

  const {
    loading: savingProfile,
    error: saveError,
    fn: fnSaveProfile,
  } = useFetch(upsertProfile);

  const {
    loading: uploadingResume,
    error: uploadError,
    fn: fnUploadResume,
  } = useFetch(uploadProfileResume, { user_id: user?.id });

  const values = watch();

  const stepFields = {
    0: ["full_name", "location"],
    1: ["experience_years", "education"],
  };

  const goNext = async () => {
    const fields = stepFields[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    if (step === 2 && skills.length === 0) return;
    if (step === 3 && !profile?.resume_url && !resumeFile) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const addSkill = (raw) => {
    const val = raw.trim();
    if (!val) return;
    if (!skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkills((s) => [...s, val]);
    }
    setSkillInput("");
  };

  const removeSkill = (val) => setSkills((s) => s.filter((x) => x !== val));

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const okType = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type);
    if (!okType) {
      alert("Only PDF or Word documents are allowed.");
      return;
    }
    setResumeFile(file);
  };

  const onFinalSubmit = async () => {
    await fnSaveProfile({
      user_id: user.id,
      full_name: values.full_name,
      headline: values.headline || null,
      location: values.location,
      experience_years: values.experience_years,
      education: values.education,
      skills,
      phone: values.phone || null,
    });

    if (resumeFile) {
      await fnUploadResume(resumeFile);
    }

    await refetch();
    navigate(nextPath || "/jobs");
  };

  if (!isLoaded || loadingProfile) {
    return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;
  }

  const variants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-4xl">Complete Your Profile</h1>
        {isComplete && (
          <span className="hairline flex items-center gap-1.5 rounded-full bg-green-950/40 border-green-800 px-3 py-1 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-10">
        Fill this out once — every future application is a single click.
      </p>

      {/* Progress rail */}
      <div className="mb-12 flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => i < step && (setDirection(-1), setStep(i))}
                disabled={i > step}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300",
                    active && "border-primary bg-primary/10 text-primary",
                    done && "border-primary bg-primary text-background",
                    !active && !done && "border-border text-muted-foreground"
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] sm:block",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-px flex-1 bg-border relative overflow-hidden -mt-5 sm:mt-0">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-cyan transition-all duration-500"
                    style={{ width: i < step ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hairline overflow-hidden rounded-2xl bg-surface/50 p-8 backdrop-blur">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step 0 — Basics */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input {...register("full_name")} placeholder="Your full name" className="mt-1.5" />
                  {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <Label>Headline</Label>
                  <Input
                    {...register("headline")}
                    placeholder="e.g. Final-year CSE student, React & Node developer"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select your location" />
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
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>
                <div>
                  <Label>Phone (optional)</Label>
                  <Input {...register("phone")} placeholder="Your phone number" className="mt-1.5" />
                </div>
              </div>
            )}

            {/* Step 1 — Experience */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    {...register("experience_years", { valueAsNumber: true })}
                  />
                  {errors.experience_years && (
                    <p className="text-red-500 text-sm mt-1">{errors.experience_years.message}</p>
                  )}
                </div>
                <div>
                  <Label>Education</Label>
                  <Controller
                    name="education"
                    control={control}
                    render={({ field }) => (
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {EDUCATION_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => field.onChange(opt)}
                            className={cn(
                              "hairline rounded-xl px-4 py-3 text-sm text-left transition-colors duration-200",
                              field.value === opt
                                ? "border-primary bg-primary/10 text-primary"
                                : "hover:border-border-strong"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2 — Skills */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Your Skills</Label>
                  <div className="hairline mt-1.5 flex flex-wrap gap-2 rounded-xl p-3">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
                      >
                        {s}
                        <button type="button" onClick={() => removeSkill(s)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={() => addSkill(skillInput)}
                      placeholder={skills.length === 0 ? "Type a skill and press Enter" : "Add another..."}
                      className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {skills.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Add at least one skill to continue.</p>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Quick add</div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="hairline rounded-full px-3 py-1 text-xs hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Resume */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <Label>Resume</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "hairline flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed py-12 text-center transition-colors duration-200",
                    dragOver ? "border-primary bg-primary/5" : ""
                  )}
                >
                  <UploadCloud className={cn("h-8 w-8", dragOver ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-sm">
                    Drag & drop your resume, or{" "}
                    <label htmlFor="resume-upload" className="text-primary underline cursor-pointer">
                      browse
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground">PDF or Word, up to 5MB</div>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>

                {(resumeFile || profile?.resume_url) && (
                  <div className="hairline flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">
                      {resumeFile?.name || profile?.resume_filename || "Current resume"}
                    </span>
                  </div>
                )}
                {!profile?.resume_url && !resumeFile && (
                  <p className="text-xs text-muted-foreground">Required to complete your profile.</p>
                )}
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <ReviewRow label="Name" value={values.full_name} onEdit={() => setStep(0)} />
                <ReviewRow label="Headline" value={values.headline || "—"} onEdit={() => setStep(0)} />
                <ReviewRow label="Location" value={values.location} onEdit={() => setStep(0)} />
                <ReviewRow label="Experience" value={`${values.experience_years} yrs`} onEdit={() => setStep(1)} />
                <ReviewRow label="Education" value={values.education} onEdit={() => setStep(1)} />
                <ReviewRow label="Skills" value={skills.join(", ")} onEdit={() => setStep(2)} />
                <ReviewRow
                  label="Resume"
                  value={resumeFile?.name || profile?.resume_filename || "—"}
                  onEdit={() => setStep(3)}
                />

                {saveError?.message && <p className="text-red-500 text-sm">{saveError.message}</p>}
                {uploadError?.message && <p className="text-red-500 text-sm">{uploadError.message}</p>}
                {(savingProfile || uploadingResume) && <BarLoader width={"100%"} color="#7c5cff" />}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit(onFinalSubmit)}
            disabled={savingProfile || uploadingResume}
            className="gap-2"
          >
            Save Profile <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const ReviewRow = ({ label, value, onEdit }) => (
  <div className="hairline flex items-center justify-between rounded-xl px-4 py-3">
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
    <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-primary">
      <Pencil className="h-4 w-4" />
    </button>
  </div>
);

export default ProfilePage;
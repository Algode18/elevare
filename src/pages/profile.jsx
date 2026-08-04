import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import CitySelect from "@/components/city-select";
import { BarLoader } from "react-spinners";
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileText,
  Globe,
  X,
  Pencil,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
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
import useProfile from "@/hooks/use-profile";
import useResumes from "@/hooks/use-resumes";
import { upsertProfile } from "@/api/apiProfiles";
import { getProfileSections, getProfileCompletion } from "@/lib/profile-completion";
import { cn } from "@/lib/utils";
// import AmbientOrbs from "@/components/ambient-orbs";

const SUGGESTED_SKILLS = [
  "React", "Node.js", "JavaScript", "TypeScript", "Java",
  "Python", "MongoDB", "PostgreSQL", "Tailwind CSS", "Git",
];
const EDUCATION_OPTIONS = ["Intermediate", "Graduate", "Post Graduate"];

const SECTION_ICONS = {
  personal: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Sparkles,
  resume: FileText,
  preferences: Globe,
};

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Counts up 0 -> value once on mount/value change, per the brief's
// "completion circle count animation" direction.
const useCountUp = (value, duration = 600) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
};

const SectionCard = ({ section, index, summary, onEdit, href }) => {
  const Icon = SECTION_ICONS[section.key];
  const Wrapper = href ? Link : "button";

  return (
    <Wrapper
      to={href}
      type={href ? undefined : "button"}
      onClick={href ? undefined : onEdit}
      className="hover-lift animate-in fade-in slide-in-from-bottom-2 hairline group flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left hover:border-primary/40"
      style={{ animationDelay: `${index * 60}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{section.label}</div>
        <div className="truncate text-xs text-muted-foreground">{summary}</div>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
        Edit <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Wrapper>
  );
};

const ProfilePage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  const { profile, loading: loadingProfile, refetch } = useProfile();
  const { resumes, defaultResume, loading: loadingResumes } = useResumes();

  const [editingSection, setEditingSection] = useState(null); // "personal" | "experience" | ...
  const [form, setForm] = useState({});
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const { loading: saving, error: saveError, fn: fnSave } = useFetch(upsertProfile);

  const openEditor = (key) => {
    setForm({
      full_name: profile?.full_name || user?.fullName || "",
      headline: profile?.headline || "",
      location: profile?.location || "",
      phone: profile?.phone || "",
      experience_years: profile?.experience_years ?? "",
      education: profile?.education || "",
      portfolio_url: profile?.portfolio_url || "",
      linkedin_url: profile?.linkedin_url || "",
    });
    setSkills(profile?.skills || []);
    setEditingSection(key);
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addSkill = (raw) => {
    const val = raw.trim();
    if (!val) return;
    if (!skills.some((s) => s.toLowerCase() === val.toLowerCase())) setSkills((s) => [...s, val]);
    setSkillInput("");
  };
  const removeSkill = (val) => setSkills((s) => s.filter((x) => x !== val));

  const SECTION_FIELDS = {
    personal: ["full_name", "headline", "location", "phone"],
    experience: ["experience_years"],
    education: ["education"],
    skills: ["skills"],
    preferences: ["portfolio_url", "linkedin_url"],
  };

  const handleSave = async () => {
    const fields = SECTION_FIELDS[editingSection] || [];
    const payload = { user_id: user.id };
    for (const f of fields) {
      if (f === "skills") payload.skills = skills;
      else if (f === "experience_years") payload.experience_years = form.experience_years === "" ? null : Number(form.experience_years);
      else payload[f] = form[f] || null;
    }
    await fnSave(payload);
    await refetch();
    setEditingSection(null);
  };

  const sections = getProfileSections(profile, resumes.length);
  const completion = getProfileCompletion(profile, resumes.length);
  const animatedCompletion = useCountUp(completion);

  if (!isLoaded || loadingProfile || loadingResumes) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  const summaries = {
    personal: profile?.location ? `${profile.full_name || "—"} · ${profile.location}` : profile?.full_name || "Not set",
    experience: profile?.experience_years != null ? `${profile.experience_years} yrs experience` : "Not set",
    education: profile?.education || "Not set",
    skills: profile?.skills?.length ? profile.skills.slice(0, 4).join(", ") : "Not set",
    resume: resumes.length
      ? `${resumes.length} version${resumes.length > 1 ? "s" : ""} · Default: ${defaultResume?.title}`
      : "No resume uploaded",
    preferences: profile?.phone || profile?.portfolio_url || profile?.linkedin_url ? "Set" : "Not set",
  };

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl px-2 py-2">
      {/* <AmbientOrbs /> */}
      {/* Hero */}
      <div className="hairline relative mb-8 overflow-hidden rounded-[28px] bg-elevated p-8">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Career Profile
        </div>
        <h1 className="mt-2 text-center font-display text-3xl sm:text-left sm:text-4xl">
          Everything recruiters need, beautifully organized.
        </h1>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="w-full sm:w-auto">
            <div className="text-xs text-muted-foreground">Profile Completion</div>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border sm:w-40 sm:flex-none">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-lg font-semibold">{animatedCompletion}%</span>
            </div>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div className="mt-0.5 font-medium">{timeAgo(profile?.updated_at)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Preferred Resume</div>
              <div className="mt-0.5 font-medium">{defaultResume?.title || "None yet"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="flex flex-col gap-3">
        {sections.map((s, i) =>
          s.key === "resume" ? (
            <SectionCard key={s.key} section={s} index={i} summary={summaries.resume} href="/resume" />
          ) : (
            <SectionCard
              key={s.key}
              section={s}
              index={i}
              summary={summaries[s.key]}
              onEdit={() => openEditor(s.key)}
            />
          )
        )}
      </div>

      {/* Edit drawer — shared shell, fields swap per section */}
      <Drawer open={!!editingSection} onOpenChange={(o) => !o && setEditingSection(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Edit {sections.find((s) => s.key === editingSection)?.label}
            </DrawerTitle>
            <DrawerDescription>Changes save immediately to your Career Profile.</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 p-4 pb-0">
            {editingSection === "personal" && (
              <>
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1.5" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
                </div>
                <div>
                  <Label>Headline</Label>
                  <Input className="mt-1.5" value={form.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="e.g. Final-year CSE student, React & Node developer" />
                </div>
                <div>
                  <Label>Location</Label>
                  <CitySelect
                    value={form.location}
                    onChange={(v) => setField("location", v)}
                    placeholder="Select your location"
                    allowClear={false}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1.5" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
              </>
            )}

            {editingSection === "experience" && (
              <div>
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={form.experience_years}
                  onChange={(e) => setField("experience_years", e.target.value)}
                />
              </div>
            )}

            {editingSection === "education" && (
              <div>
                <Label>Education</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {EDUCATION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setField("education", opt)}
                      className={cn(
                        "hairline rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200",
                        form.education === opt ? "border-primary bg-primary/10 text-primary" : "hover:border-border-strong"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingSection === "skills" && (
              <div>
                <Label>Your Skills</Label>
                <div className="hairline mt-1.5 flex flex-wrap gap-2 rounded-xl p-3">
                  {skills.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    onBlur={() => addSkill(skillInput)}
                    placeholder={skills.length === 0 ? "Type a skill and press Enter" : "Add another..."}
                    className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="hairline rounded-full px-3 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingSection === "preferences" && (
              <>
                <div>
                  <Label>Portfolio</Label>
                  <Input className="mt-1.5" value={form.portfolio_url} onChange={(e) => setField("portfolio_url", e.target.value)} placeholder="https://yourportfolio.com" />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input className="mt-1.5" value={form.linkedin_url} onChange={(e) => setField("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/you" />
                </div>
              </>
            )}

            {saveError?.message && <p className="text-sm text-red-500">{saveError.message}</p>}
            {saving && <BarLoader width={"100%"} color="var(--primary)" />}
          </div>

          <DrawerFooter>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              Save <Check className="h-4 w-4" />
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {nextPath && (
        <div className="mt-6 flex justify-end">
          <Button onClick={() => navigate(nextPath)} className="gap-2">
            Continue to job <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
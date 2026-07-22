import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Briefcase, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    key: "candidate",
    title: "I'm looking for a job",
    description: "Browse roles, build a profile once, and apply in a click.",
    icon: Briefcase,
  },
  {
    key: "recruiter",
    title: "I'm hiring",
    description: "Post roles, manage applicants, and track your pipeline.",
    icon: Building2,
  },
];

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(null);

  const handleRoleSelection = async (role) => {
    setSaving(role);
    try {
      await user.update({ unsafeMetadata: { role } });
      navigate(role === "recruiter" ? "/employer/dashboard" : "/dashboard");
    } catch (err) {
      console.error("Error updating role:", err);
      setSaving(null);
    }
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigate(
        user?.unsafeMetadata?.role === "recruiter" ? "/employer/dashboard" : "/dashboard"
      );
    }
  }, [user]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-lg font-bold">
        E
      </div>
      <h1 className="mt-6 font-display text-4xl sm:text-5xl">How will you use Elevare?</h1>
      <p className="mt-3 text-muted-foreground">You can't switch this later without contacting support, so pick the one that fits.</p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isSaving = saving === r.key;
          return (
            <button
              key={r.key}
              type="button"
              disabled={!!saving}
              onClick={() => handleRoleSelection(r.key)}
              className={cn(
                "hairline group flex flex-col items-start gap-3 rounded-2xl bg-surface/60 p-6 text-left transition-colors duration-200 hover:border-primary/50 disabled:opacity-60",
                isSaving && "border-primary"
              )}
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="font-medium">{r.title}</div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                {isSaving ? "Saving…" : "Continue"} <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      {saving && <BarLoader className="mt-8" width={"100%"} color="#7c5cff" />}
    </div>
  );
};

export default Onboarding;

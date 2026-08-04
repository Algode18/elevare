import { useState } from "react";
import { useUser, useClerk, useSession } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { User, ShieldCheck, Bell, Lock, ExternalLink, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deleteOwnedCompanies, removeUserFromAllCompanies } from "@/api/apiCompanies";
// import AmbientOrbs from "@/components/ambient-orbs";

const SECTIONS = [
  { key: "account", label: "Account", icon: User, desc: "Identity & sign-in" },
  { key: "security", label: "Security", icon: ShieldCheck, desc: "Password & 2FA" },
  { key: "notifications", label: "Notifications", icon: Bell, desc: "Alerts & digests" },
  { key: "privacy", label: "Privacy", icon: Lock, desc: "Data & account" },
];

const SettingsPage = () => {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { session } = useSession();
  const navigate = useNavigate();
  const [active, setActive] = useState("account");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  if (!isLoaded) return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;

  const isEmployer = user?.unsafeMetadata?.role === "recruiter";
  const role = isEmployer ? "Employer" : "Candidate";

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== "delete my account" || !user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabaseAccessToken = await session.getToken({ template: "supabase" });
      await deleteOwnedCompanies(supabaseAccessToken, { owner_id: user.id });
      await removeUserFromAllCompanies(supabaseAccessToken, { user_id: user.id });
      await user.delete();
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleteError(err?.message || "Something went wrong deleting your account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-2 py-2">
      {/* <AmbientOrbs /> */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, security, and privacy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <nav className="scrollbar-none flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 hairline flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all duration-200 hover:border-primary/40",
                  isActive ? "border-primary/50 bg-primary/5" : "hover:bg-surface-2/50"
                )}
                style={{ animationDelay: `${i * 50}ms`, animationDuration: "350ms", animationFillMode: "backwards" }}
              >
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors duration-200",
                    isActive ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className={cn("text-sm font-medium", isActive && "text-primary")}>{s.label}</div>
                  <div className="hidden truncate text-[11px] text-muted-foreground md:block">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div key={active} className="animate-in fade-in slide-in-from-bottom-1 hairline rounded-[24px] bg-elevated p-6 duration-300">
          {active === "account" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="h-14 w-14 rounded-2xl ring-1 ring-border" />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-cyan" />
                )}
                <div>
                  <div className="text-lg font-medium">{user?.fullName || "—"}</div>
                  <div className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
                </div>
              </div>

              <div className="hairline my-2 border-t" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account type</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{role}</span>
              </div>

              <button onClick={() => signOut()} className="text-sm text-destructive transition-colors hover:underline">
                Sign out
              </button>
            </div>
          )}

          {active === "security" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Password, two-factor auth, and connected accounts are managed through your Clerk account.
              </p>
              <button
                onClick={() => openUserProfile()}
                className="hover-lift flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_0_0_0_rgba(124,92,255,0)] transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(124,92,255,0.3)]"
              >
                Manage security <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {active === "notifications" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Notification preferences — email digests, application status alerts — are coming in a future update.
              </p>
            </div>
          )}

          {active === "privacy" && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Data export requests aren't available yet. In the meantime, reach out through the{" "}
                <a href="/contact" className="text-primary underline">contact page</a>.
              </p>

              {isEmployer ? (
                <div className="hairline space-y-4 rounded-2xl border-destructive/30 bg-destructive/5 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="text-xs text-muted-foreground">
                      Deleting your account permanently removes every company you own — along with its jobs,
                      applications, offices, and team members — plus your own memberships on any other
                      companies, and your login itself. This can't be undone.
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label className="text-xs text-muted-foreground">
                      Type <span className="font-mono font-medium text-foreground">delete my account</span> to confirm
                    </label>
                    <Input
                      className="mt-1.5"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="delete my account"
                      autoComplete="off"
                    />
                  </div>

                  {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                  {deleting && <BarLoader width={"100%"} color="var(--primary)" />}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmText.trim() !== "delete my account" || deleting}
                    className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Delete account permanently
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Account deletion for candidates is coming in a future update.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
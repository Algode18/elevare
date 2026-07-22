import { useState } from "react";
import { useUser, useClerk, useSession } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { User, ShieldCheck, Bell, Lock, ExternalLink, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deleteOwnedCompanies, removeUserFromAllCompanies } from "@/api/apiCompanies";

// Tabbed settings layout — a different pattern from the card-grid pages
// elsewhere, since settings is naturally a "pick a section, view its
// content" flow rather than a list of items to scan.
const SECTIONS = [
  { key: "account", label: "Account", icon: User },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: Lock },
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

  if (!isLoaded) return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;

  const isEmployer = user?.unsafeMetadata?.role === "recruiter";
  const role = isEmployer ? "Employer" : "Candidate";

  // Employer-only: wipe every company they own (cascades to jobs,
  // applications, offices, and team members in Supabase), drop any
  // memberships on teams they don't own, then delete the Clerk account
  // itself. There's no undo past this point.
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
    <div>
      <h1 className="mb-6 font-display text-3xl">Settings</h1>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active === s.key
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="hairline rounded-xl bg-surface/60 p-6">
          {active === "account" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="h-12 w-12 rounded-full" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-cyan" />
                )}
                <div>
                  <div className="font-medium">{user?.fullName || "—"}</div>
                  <div className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-4 text-sm">
                <span className="text-muted-foreground">Account type</span>
                <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs">{role}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-destructive hover:underline"
              >
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
                className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Manage security <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {active === "notifications" && (
            <p className="text-sm text-muted-foreground">
              Notification preferences (email digests, application status alerts) are coming in a future update.
            </p>
          )}

          {active === "privacy" && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Data export requests aren't available yet. In the meantime, reach out through the{" "}
                <a href="/contact" className="text-primary underline">contact page</a>.
              </p>

              {isEmployer ? (
                <div className="hairline space-y-4 rounded-lg border-destructive/30 bg-destructive/5 p-4">
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
                  {deleting && <BarLoader width={"100%"} color="#7c5cff" />}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmText.trim() !== "delete my account" || deleting}
                    className="rounded-md bg-destructive/10 px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50"
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
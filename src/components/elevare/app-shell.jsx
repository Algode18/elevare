import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  Send,
  User,
  FileText,
  Settings,
  BarChart3,
  ClipboardList,
  Building2,
  PanelLeft,
  LogOut,
  PenBox,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = {
  candidate: [
    {
      section: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/dashboard/jobs", label: "Discover Jobs", icon: Briefcase },
        { to: "/saved", label: "Saved Jobs", icon: Bookmark },
        { to: "/applications", label: "Applications", icon: Send },
      ],
    },
    {
      section: "Account",
      items: [
        { to: "/resume", label: "Resume", icon: FileText },
        { to: "/profile", label: "Profile", icon: User },
        { to: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ],
  recruiter: [
    {
      section: "Hire",
      items: [
        { to: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/employer/post-job", label: "Post Job", icon: PenBox },
        { to: "/employer/jobs", label: "Manage Jobs", icon: ClipboardList },
        { to: "/employer/applications", label: "Applications", icon: BarChart3 },
      ],
    },
    {
      section: "Company",
      items: [
        { to: "/employer/company", label: "Company Profile", icon: Building2 },
        { to: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ],
};

const AppShell = ({ children }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const role = user?.unsafeMetadata?.role === "recruiter" ? "recruiter" : "candidate";
  const sections = nav[role];
  const roleLabel = role === "recruiter" ? "Employer" : "Candidate";
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || "You";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatar = user?.imageUrl;

  // Exactly one nav item is "active" at a time. A naive per-item check
  // (pathname === to || pathname.startsWith(to + "/")) lights up BOTH
  // "/dashboard" and "/dashboard/jobs" while on /dashboard/jobs, since
  // "/dashboard" is a prefix of "/dashboard/jobs" too. Instead, find the
  // single item whose `to` is the longest matching prefix of the current
  // path — only that one wins.
  const allItems = sections.flatMap((sec) => sec.items);
  const activeTo = allItems
    .filter((it) => pathname === it.to || pathname.startsWith(it.to + "/"))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Top workspace navigation — logo + global search on the left,
          notifications + profile on the right. Separate from the public
          marketing navbar (no About/Companies/Contact here). */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">
              E
            </div>
            <span className="hidden font-display text-lg leading-none sm:inline">Elevare</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link to="/profile" title="Profile">
            {avatar ? (
              <img src={avatar} alt="" className="h-7 w-7 rounded-full bg-surface-2" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-cyan" />
            )}
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "sticky top-0 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all",
            collapsed ? "w-[64px]" : "w-[220px]"
          )}
        >
          <div className={cn("flex items-center px-3 py-3", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {roleLabel}
              </span>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2">
            {sections.map((sec) => (
              <div key={sec.section} className="mb-4">
                {!collapsed && (
                  <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {sec.section}
                  </div>
                )}
                <div className="space-y-0.5">
                  {sec.items.map((it) => {
                    const active = it.to === activeTo;
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md border-l-2 px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(124,92,255,0.15),0_0_12px_-2px_rgba(124,92,255,0.45)]"
                            : "border-l-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          collapsed && "justify-center"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {!collapsed && (
            <div className="border-t border-sidebar-border p-3">
              <div className="flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent">
                {avatar ? (
                  <img src={avatar} alt="" className="h-7 w-7 rounded-full bg-surface-2" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-cyan" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="min-w-0 flex-1 p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
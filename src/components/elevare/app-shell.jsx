import { useEffect, useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme-toggle";

const nav = {
  candidate: [
    {
      section: null,
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/dashboard/jobs", label: "Discover Jobs", icon: Briefcase },
        { to: "/companies", label: "Companies", icon: Building2 },
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
      section: null,
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

// Shared nav-item list, used by both the desktop sidebar and the mobile
// slide-in drawer so the two never drift apart. `collapsed` only ever
// applies on desktop (icon-only rail); the drawer always renders expanded.
const NavList = ({ sections, activeTo, collapsed, onNavigate }) => (
  <nav className="flex-1 overflow-y-auto px-2 pt-2">
    {sections.map((sec, i) => (
      <div key={sec.section || i} className="mb-4">
        {!collapsed && sec.section && (
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
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md border-l-2 px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_15%,transparent),0_0_12px_-2px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
                    : "border-l-transparent text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-accent-foreground",
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
);

// Shared account footer (avatar, name, email, sign out) — same content in
// the desktop rail and the mobile drawer.
const ProfileFooter = ({ avatar, name, email, onSignOut }) => (
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
        onClick={onSignOut}
        className="rounded p-1 text-muted-foreground hover:text-foreground"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const AppShell = ({ children }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { pathname } = useLocation();

  const role = user?.unsafeMetadata?.role === "recruiter" ? "recruiter" : "candidate";
  const sections = nav[role];
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

  // Close the mobile drawer whenever the route changes (link click already
  // does this too, but this covers back/forward nav and programmatic
  // navigation from within a page).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Belt-and-suspenders fix for a second/outer scrollbar appearing behind
  // this shell. The layout is only ever supposed to scroll inside the
  // `overflow-y-auto` content pane below — never `document.body`. If
  // *anything* (a stray element, a third-party lib, a stale style) ever
  // pushes html/body's own scrollHeight past the viewport, the browser
  // silently adds its own scrollbar on top of ours, and you get two.
  // Setting inline styles here beats any class-based CSS rule (short of
  // !important) and guarantees the document itself can never scroll while
  // this shell is mounted — regardless of what's causing the overflow.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
    };
  }, []);

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop sidebar — hidden below lg, replaced by the mobile top bar + drawer */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all lg:flex",
          collapsed ? "w-[64px]" : "w-[220px]"
        )}
      >
        <div className={cn("flex h-14 items-center gap-2 px-3", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">
              E
            </div>
            {!collapsed && <span className="truncate font-display text-lg leading-none">Elevare</span>}
          </Link>
          {!collapsed && (
            <div className="flex shrink-0 items-center gap-0.5">
              <ThemeToggle className="h-8 w-8" />
              <button
                onClick={() => setCollapsed(true)}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {collapsed && (
          <div className="mx-auto -mt-1 mb-1 flex flex-col items-center gap-0.5">
            <button
              onClick={() => setCollapsed(false)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <ThemeToggle className="h-8 w-8" />
          </div>
        )}

        <NavList sections={sections} activeTo={activeTo} collapsed={collapsed} />

        {!collapsed && <ProfileFooter avatar={avatar} name={name} email={email} onSignOut={() => signOut()} />}
      </aside>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[260px] max-w-[80vw] flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-14 items-center justify-between gap-2 px-3">
                <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setMobileNavOpen(false)}>
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-xs font-bold">
                    E
                  </div>
                  <span className="truncate font-display text-lg leading-none">Elevare</span>
                </Link>
                <div className="flex shrink-0 items-center gap-0.5">
                  <ThemeToggle className="h-8 w-8" />
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close menu"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <NavList
                sections={sections}
                activeTo={activeTo}
                collapsed={false}
                onNavigate={() => setMobileNavOpen(false)}
              />

              <ProfileFooter avatar={avatar} name={name} email={email} onSignOut={() => signOut()} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background">
        {/* Mobile top bar — replaces the sidebar's logo/branding below lg.
            h-16 (64px) sits at the top of the 60-64px range recommended for
            mobile nav bars; the hamburger gets a proper 44x44 touch target
            instead of relying on padding alone; env(safe-area-inset-top)
            keeps it clear of notches/dynamic islands on modern phones. */}
        <div
          className="navbar-frosted sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 pl-2 pr-4 lg:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <Menu className="h-[21px] w-[21px]" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan text-primary-foreground text-[10px] font-bold">
              E
            </div>
            <span className="truncate font-display text-base leading-none">Elevare</span>
          </div>
          <ThemeToggle className="ml-auto" />
        </div>

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
  );
};

export default AppShell;
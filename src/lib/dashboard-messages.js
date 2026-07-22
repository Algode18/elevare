// Dynamic "Welcome back" headline + subtitle logic for the candidate and
// employer dashboards. Picks the single most relevant scenario for the
// user right now instead of a static greeting + search bar.

function isWithinLastDay(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= 24 * 60 * 60 * 1000;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

/**
 * Builds everything the redesigned employer dashboard needs from one
 * `getMyJobs` payload — hero copy, clickable KPIs, a "needs attention"
 * queue, the hiring funnel, and enriched recent lists. Keeps the page
 * component purely presentational.
 *
 * @param {{ user: import("@clerk/types").UserResource | null, jobs: any[] | null }} args
 */
export function getEmployerDashboardData({ user, jobs }) {
  const firstName = user?.firstName || "";
  const list = jobs || [];
  const totalJobs = list.length;
  const openJobs = list.filter((j) => j.isOpen).length;

  const allApplicants = list.flatMap((j) =>
    (j.applications || []).map((a) => ({ ...a, job_title: j.title, job_id: j.id }))
  );
  const totalApplicants = allApplicants.length;
  const newToday = allApplicants.filter((a) => isWithinLastDay(a.created_at)).length;

  const countByStatus = (status) => allApplicants.filter((a) => a.status === status).length;
  const interviewingCount = countByStatus("interviewing");
  const offerCount = countByStatus("offer");
  const hiredCount = countByStatus("hired");
  const hiringRate = totalApplicants ? Math.round(((offerCount + hiredCount) / totalApplicants) * 100) : 0;

  // Empty state — no jobs posted at all yet.
  if (totalJobs === 0) {
    return {
      isEmpty: true,
      greeting: `Welcome back${firstName ? `, ${firstName}` : ""} 👋`,
      subtitle: "Your company profile is ready. Post your first job to start receiving applications.",
      cta: { label: "+ Post First Job", to: "/employer/post-job" },
    };
  }

  const bullets = [
    `${openJobs} active job${openJobs === 1 ? "" : "s"}`,
    interviewingCount > 0
      ? `${interviewingCount} interview${interviewingCount === 1 ? "" : "s"} in progress`
      : null,
    newToday > 0
      ? `${newToday} new applicant${newToday === 1 ? "" : "s"} today`
      : totalApplicants > 0
      ? `${totalApplicants} total applicant${totalApplicants === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  // Same info as `bullets`, condensed to one line for the compact hero.
  const statLine = bullets.join(" · ");

  // Most-recently-touched company this recruiter posts under. Companies
  // are a shared list (no owner_id), so we approximate "their" company as
  // whichever one their newest job listing uses.
  const latestJobWithCompany = list
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .find((j) => j.company);
  const primaryCompany = latestJobWithCompany?.company || null;
  const companyProfile = primaryCompany
    ? {
        name: primaryCompany.name,
        hasLogo: Boolean(primaryCompany.logo_url),
        status: primaryCompany.logo_url ? null : "Logo missing",
      }
    : { name: null, hasLogo: false, status: null };

  // Needs Attention — jobs stalled with zero applicants, jobs with a backlog
  // of unreviewed candidates, and an affirmation when interviews are active.
  const needsAttention = [];
  list.forEach((job) => {
    const apps = job.applications || [];
    const daysSincePosted = job.created_at
      ? Math.floor((Date.now() - new Date(job.created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    if (job.isOpen && apps.length === 0 && daysSincePosted >= 5) {
      needsAttention.push({
        tone: "warning",
        title: job.title,
        detail: `No applicants in ${daysSincePosted} days`,
        to: "/employer/jobs",
      });
    }

    const waiting = apps.filter((a) => a.status === "applied").length;
    if (waiting >= 5) {
      needsAttention.push({
        tone: "warning",
        title: job.title,
        detail: `${waiting} applicants waiting for review`,
        to: "/employer/applications",
      });
    }
  });
  if (interviewingCount > 0) {
    needsAttention.push({
      tone: "success",
      title: `${interviewingCount} interview${interviewingCount === 1 ? "" : "s"} in progress`,
      detail: "Keep the momentum going",
      to: "/employer/applications",
    });
  }

  // Hiring pipeline funnel. "Applied" counts everyone; later stages count
  // anyone at that stage or beyond (rejected candidates excluded from
  // downstream stages since we can't know how far they got).
  const stageOrder = ["applied", "reviewed", "interviewing", "offer", "hired"];
  const atOrBeyond = (stage) => {
    const idx = stageOrder.indexOf(stage);
    return allApplicants.filter((a) => stageOrder.indexOf(a.status) >= idx).length;
  };
  const pipeline = [
    { stage: "Applied", status: "applied", count: totalApplicants },
    { stage: "Reviewed", status: "reviewed", count: atOrBeyond("reviewed") },
    { stage: "Interview", status: "interviewing", count: atOrBeyond("interviewing") },
    { stage: "Offer", status: "offer", count: atOrBeyond("offer") },
    { stage: "Hired", status: "hired", count: atOrBeyond("hired") },
  ];

  const recentApplicants = allApplicants
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentJobs = list
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  // Lightweight activity feed — job postings and new applicants, merged
  // and sorted by recency. We only have creation timestamps to work with,
  // so this reflects "created" events rather than every status change.
  const activity = [
    ...list.map((job) => ({
      id: `job-${job.id}`,
      icon: "job",
      text: `${job.title} published`,
      at: job.created_at,
    })),
    ...allApplicants.map((a) => ({
      id: `app-${a.id}`,
      icon: "applicant",
      text: `${a.name || "A candidate"} applied to ${a.job_title}`,
      at: a.created_at,
    })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

  return {
    isEmpty: false,
    greeting: `Welcome back${firstName ? `, ${firstName}` : ""} 👋`,
    bullets,
    statLine,
    cta: { label: "+ Post Job", to: "/employer/post-job" },
    kpis: [
      {
        label: "Open Jobs",
        value: openJobs,
        sublabel: "Active now",
        to: "/employer/jobs",
        hint: "View Jobs →",
      },
      {
        label: "Applications",
        value: totalApplicants,
        sublabel: newToday > 0 ? `+${newToday} today` : "Total",
        to: "/employer/applications",
        hint: "Review →",
      },
      {
        label: "Interviews",
        value: interviewingCount,
        sublabel: "In progress",
        to: "/employer/applications?status=interviewing",
        hint: "View →",
      },
      {
        label: "Hiring Rate",
        value: `${hiringRate}%`,
        sublabel: "Offer + hired",
        to: "/employer/applications",
        hint: "Details →",
      },
    ],
    needsAttention: needsAttention.slice(0, 4),
    pipeline,
    recentApplicants,
    recentJobs,
    activity,
    companyProfile,
  };
}

/**
 * @param {{ user: import("@clerk/types").UserResource | null, applications: any[] | null }} args
 */
export function getCandidateHeadline({ user, applications }) {
  const firstName = user?.firstName || "";
  const apps = applications || [];
  const total = apps.length;
  const interviewing = apps.filter((a) => a.status === "interviewing").length;
  const offers = apps.filter((a) => a.status === "offer" || a.status === "hired").length;
  const recentUpdates = apps.filter(
    (a) => isWithinLastDay(a.created_at) === false && ["reviewed", "interviewing", "offer", "hired"].includes(a.status)
  ).length;

  // No applications yet.
  if (total === 0) {
    return {
      greeting: `Welcome back${firstName ? `, ${firstName}` : ""} 👋`,
      subtitle: "Your profile is ready. Browse jobs to submit your first application.",
      cta: { label: "+ Browse Jobs", to: "/jobs" },
    };
  }

  // Offer or hired — biggest news, surface it first.
  if (offers > 0) {
    return {
      greeting: `Congrats${firstName ? `, ${firstName}` : ""}! 🎉`,
      subtitle: `You have ${offers} offer${offers === 1 ? "" : "s"} waiting. Check your applications for next steps.`,
      cta: { label: "View Applications →", to: "/applications" },
    };
  }

  // Interview stage.
  if (interviewing > 0) {
    return {
      greeting: `Welcome back${firstName ? `, ${firstName}` : ""}!`,
      subtitle: `You have ${interviewing} interview${interviewing === 1 ? "" : "s"} lined up. Good luck!`,
      cta: { label: "View Applications →", to: "/applications" },
    };
  }

  // Applications submitted, nothing new — general status.
  if (total > 0 && recentUpdates === 0) {
    return {
      greeting: `Welcome back${firstName ? `, ${firstName}` : ""} 👋`,
      subtitle: `${total} application${total === 1 ? "" : "s"} submitted. We'll keep you posted on updates.`,
      cta: null,
    };
  }

  // Fallback — quiet.
  return {
    greeting: `Welcome back${firstName ? `, ${firstName}` : ""}.`,
    subtitle: "Everything looks up to date. Browse new jobs or polish your profile.",
    cta: null,
  };
}
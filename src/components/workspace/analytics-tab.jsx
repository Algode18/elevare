import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import {
  Eye,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";

import useFetch from "@/hooks/use-fetch";
import { getCompanyAnalytics, getCompanyFollowers } from "@/api/apiCompanies";

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="hairline rounded-lg bg-surface-2/40 p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="mt-2 font-display text-2xl">{value}</div>
    {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const AnalyticsTab = ({ company }) => {
  const { data: stats, loading, fn: fnStats } = useFetch(getCompanyAnalytics, {
    company_id: company?.id,
  });
  const { data: followers, loading: loadingFollowers, fn: fnFollowers } = useFetch(
    getCompanyFollowers,
    { company_id: company?.id }
  );

  useEffect(() => {
    if (company?.id) {
      fnStats();
      fnFollowers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-sm font-semibold">Analytics</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          How your company page and job listings are performing.
        </p>
      </div>

      {loading !== false && <BarLoader width={"100%"} color="#7c5cff" />}

      {loading === false && stats && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Eye} label="Profile Views" value={stats.profile_views} />
            <StatCard icon={Users} label="Followers" value={stats.followers_count} />
            <StatCard
              icon={Briefcase}
              label="Open Jobs"
              value={stats.open_jobs}
              hint={`${stats.total_jobs} total posted`}
            />
            <StatCard icon={FileText} label="Applications" value={stats.total_applications} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={TrendingUp} label="Hiring Rate" value={`${stats.hiring_rate}%`} hint="Applications → hired" />
            <StatCard icon={CheckCircle2} label="Offer Rate" value={`${stats.offer_rate}%`} hint="Applications → decided" />
            <StatCard icon={Flame} label="Acceptance Rate" value={`${stats.acceptance_rate}%`} hint="Offers → accepted" />
            <StatCard
              icon={Clock}
              label="Avg. Hiring Time"
              value={stats.avg_hiring_time_days != null ? `${stats.avg_hiring_time_days}d` : "—"}
              hint="Applied → hired"
            />
            <StatCard
              icon={Clock}
              label="Avg. Response Time"
              value={stats.avg_response_time_days != null ? `${stats.avg_response_time_days}d` : "—"}
              hint="Applied → any decision"
            />
            <StatCard
              icon={Briefcase}
              label="Most Applied Job"
              value={stats.most_applied_job?.title || "—"}
              hint={stats.most_applied_job ? `${stats.most_applied_job.count} applications` : undefined}
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-1 text-sm font-semibold">Followers</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Candidates who follow {company?.name || "your company"} and get notified about new roles.
        </p>

        {loadingFollowers !== false && <BarLoader width={"100%"} color="#7c5cff" />}

        {loadingFollowers === false && (
          <div className="hairline divide-y divide-border/60 rounded-lg bg-surface-2/40">
            {followers?.length ? (
              followers.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {f.profile?.full_name || "Candidate"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[f.profile?.headline, f.profile?.location].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(f.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No followers yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
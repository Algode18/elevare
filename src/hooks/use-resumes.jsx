import { useEffect } from "react";
import { useUser } from "@clerk/react";
import useFetch from "@/hooks/use-fetch";
import { getResumes, getResumeUsageStats } from "@/api/apiResumes";

// App-wide resume library hook. Returns the user's resumes merged with
// real usage stats (applications/interviews/last used) computed from the
// applications table, plus a recent-activity feed for the timeline.
const useResumes = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { data: resumes, loading: loadingResumes, fn: fnResumes } = useFetch(getResumes, {
    user_id: user?.id,
  });
  const { data: stats, loading: loadingStats, fn: fnStats } = useFetch(getResumeUsageStats, {
    user_id: user?.id,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fnResumes();
      fnStats();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const byResumeId = stats?.byResumeId || {};
  const list = (resumes || []).map((r) => ({
    ...r,
    applications: byResumeId[r.id]?.applications || 0,
    interviews: byResumeId[r.id]?.interviews || 0,
    lastUsedAt: byResumeId[r.id]?.lastUsedAt || null,
  }));

  const refetch = () => {
    fnResumes();
    fnStats();
  };

  return {
    resumes: list,
    defaultResume: list.find((r) => r.is_default) || list[0] || null,
    recentActivity: stats?.recentActivity || [],
    loading: isSignedIn ? loadingResumes || loadingStats : false,
    refetch,
  };
};

export default useResumes;
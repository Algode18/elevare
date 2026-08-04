import { useEffect } from "react";
import { useUser } from "@clerk/react";
import useFetch from "@/hooks/use-fetch";
import { getProfile } from "@/api/apiProfiles";

// App-wide profile status hook. "Complete" here means the hard minimum to
// apply at all (name + skills) — the smaller extras like phone/portfolio/
// LinkedIn are handled by the Quick Profile Check drawer during Apply, not
// a redirect gate, per the new SaaS-style apply flow.
const useProfile = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { data: profile, loading, fn: fnProfile } = useFetch(getProfile, {
    user_id: user?.id,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) fnProfile();
  }, [isLoaded, isSignedIn, user?.id]);

  const isComplete = Boolean(profile?.full_name && profile?.skills?.length);

  return {
    profile,
    loading: isSignedIn ? loading : false,
    isComplete,
    refetch: fnProfile,
  };
};

export default useProfile;
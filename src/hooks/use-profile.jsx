import { useEffect } from "react";
import { useUser } from "@clerk/react";
import useFetch from "@/hooks/use-fetch";
import { getProfile } from "@/api/apiProfiles";

// App-wide profile status hook. Used anywhere we need to know "does this
// user have a complete profile yet?" — e.g. gating the Apply flow so it
// behaves like Indeed's "complete your profile once" pattern instead of
// asking for skills/education/resume on every single application.
const useProfile = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { data: profile, loading, fn: fnProfile } = useFetch(getProfile, {
    user_id: user?.id,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) fnProfile();
  }, [isLoaded, isSignedIn, user?.id]);

  return {
    profile,                          // null until profile exists
    loading: isSignedIn ? loading : false,
    isComplete: !!profile?.is_complete, // mirrors the DB-computed column
    refetch: fnProfile,                // call after saving the profile form
  };
};

export default useProfile;
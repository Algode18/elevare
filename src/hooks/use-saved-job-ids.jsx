import { useEffect } from "react";
import { useUser } from "@clerk/react";
import useFetch from "@/hooks/use-fetch";
import { getSavedJobIds } from "@/api/apiJobs";

// Returns a Set of job_ids the current user has saved, refetched whenever
// sign-in state changes. Signed-out users get an empty Set — no request
// is made (useFetch requires a Clerk session, so we only call it when
// isSignedIn is true).
const useSavedJobIds = () => {
  const { isSignedIn } = useUser();
  const { data: savedIds, loading, fn: fnSavedIds } = useFetch(getSavedJobIds);

  useEffect(() => {
    if (isSignedIn) fnSavedIds();
  }, [isSignedIn]);

  return {
    savedIdSet: new Set(isSignedIn ? savedIds || [] : []),
    loading: isSignedIn ? loading : false,
  };
};

export default useSavedJobIds;
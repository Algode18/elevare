import { useSession } from "@clerk/react";
import { useRef, useState } from "react";

const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const { session, isLoaded: isSessionLoaded } = useSession();

  // Tags each call so that if fn() fires again before an earlier call
  // resolves (e.g. rapid filter changes), only the most recent call is
  // allowed to write to state — an older response resolving late can no
  // longer clobber fresher data.
  const callId = useRef(0);

  const fn = async (...args) => {
    const thisCall = ++callId.current;
    setLoading(true);
    setError(null);

    try {
      // Clerk's session can still be null/loading the first time a page
      // fires a fetch (e.g. a mount-time effect that runs a beat before
      // useSession() settles). Calling session.getToken() on null throws
      // an unhelpful generic error — surface a clear one instead so it's
      // obvious what happened, rather than swallowing it silently.
      if (!isSessionLoaded || !session) {
        throw new Error("Not signed in yet — please try again in a moment.");
      }

      const supabaseAccessToken = await session.getToken({
        template: "supabase",
      });
      const response = await cb(supabaseAccessToken, options, ...args);
      if (thisCall !== callId.current) return; // a newer call has since started — drop this stale result
      setData(response);
      setError(null);
    } catch (error) {
      if (thisCall !== callId.current) return;
      setError(error);
    } finally {
      if (thisCall === callId.current) setLoading(false);
    }
  };

  return { data, loading, error, fn };
};

export default useFetch;
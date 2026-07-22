import { useUser } from "@clerk/react";
import ApplicationCard from "./application-card";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { getApplications } from "@/api/apiApplications";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";

const CreatedApplications = () => {
  const { user } = useUser();

  const {
    loading: loadingApplications,
    data: applications,
    fn: fnApplications,
  } = useFetch(getApplications, {
    user_id: user.id,
  });

  useEffect(() => {
    fnApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingApplications) {
    return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;
  }

  if (!applications?.length) {
    return (
      <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Send className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">No applications yet.</div>
        <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
          Browse jobs →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          isCandidate={true}
        />
      ))}
    </div>
  );
};

export default CreatedApplications;

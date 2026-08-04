import { getMyJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import JobCard from "./job-card";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

const CreatedJobs = () => {
  const { user } = useUser();

  const {
    loading: loadingCreatedJobs,
    data: createdJobs,
    fn: fnCreatedJobs,
  } = useFetch(getMyJobs, {
    recruiter_id: user.id,
  });

  useEffect(() => {
    fnCreatedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingCreatedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  if (!createdJobs?.length) {
    return (
      <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">You haven't posted any jobs yet.</div>
        <Link to="/employer/post-job" className="text-sm font-medium text-primary hover:underline">
          Post your first job →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {createdJobs.map((job) => (
        <JobCard key={job.id} job={job} onJobSaved={fnCreatedJobs} isMyJob />
      ))}
    </div>
  );
};

export default CreatedJobs;
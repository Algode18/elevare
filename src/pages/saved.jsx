import { getSavedJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Bookmark } from "lucide-react";

const SavedJobsPage = () => {
  const { isLoaded } = useUser();

  const {
    loading: loadingSavedJobs,
    data: savedJobs,
    fn: fnSavedJobs,
  } = useFetch(getSavedJobs);

  useEffect(() => {
    if (isLoaded) fnSavedJobs();
  }, [isLoaded]);

  if (!isLoaded || loadingSavedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Saved Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {savedJobs?.length
            ? `${savedJobs.length} job${savedJobs.length === 1 ? "" : "s"} saved for later.`
            : "Jobs you save while browsing show up here."}
        </p>
      </div>

      {loadingSavedJobs === false && (
        savedJobs?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((saved) => (
              <JobCard
                key={saved.id}
                job={saved?.job}
                onJobSaved={fnSavedJobs}
                savedInit={true}
              />
            ))}
          </div>
        ) : (
          <div className="hairline flex flex-col items-center gap-3 rounded-2xl bg-surface p-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">No saved jobs yet.</div>
            <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">
              Browse jobs →
            </Link>
          </div>
        )
      )}
    </div>
  );
};

export default SavedJobsPage;

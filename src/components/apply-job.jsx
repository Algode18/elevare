import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import useFetch from "@/hooks/use-fetch";
import useProfile from "@/hooks/use-profile";
import { applyWithProfile } from "@/api/apiApplications";
import { BarLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { FileText, Pencil } from "lucide-react";

// "Easily Apply" — if the candidate's profile is complete, applying is a
// single confirm click using their saved resume/skills/education. If not,
// they're sent to /profile once; every application after that is instant.
const ApplyJobDrawer = ({ user, job, fetchJob, applied = false }) => {
  const { profile, isComplete, loading: loadingProfile } = useProfile();

  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyWithProfile);

  const onConfirmApply = () => {
    fnApply({
      job_id: job.id,
      candidate_id: user.id,
      name: user.fullName,
      profile,
    }).then(() => {
      fetchJob();
    });
  };

  // Profile incomplete — send them to complete it once, then bring them
  // straight back to this job.
  if (!loadingProfile && !isComplete) {
    return (
      <Link to={`/profile?next=/jobs/${job.id}`}>
        <Button
          size="lg"
          variant={job?.isOpen && !applied ? "blue" : "destructive"}
          disabled={!job?.isOpen || applied}
          className="w-full"
        >
          {job?.isOpen ? (applied ? "Applied" : "Complete Profile to Apply") : "Hiring Closed"}
        </Button>
      </Link>
    );
  }

  return (
    <Drawer open={applied ? false : undefined}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          variant={job?.isOpen && !applied ? "blue" : "destructive"}
          disabled={!job?.isOpen || applied || loadingProfile}
          className="w-full"
        >
          {job?.isOpen ? (applied ? "Applied" : "Easily Apply") : "Hiring Closed"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Apply for {job?.title} at {job?.company?.name}
          </DrawerTitle>
          <DrawerDescription>Review your profile before submitting</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 p-4 pb-0">
          <div className="hairline rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{profile?.full_name}</div>
              <Link to={`/profile?next=/jobs/${job.id}`} className="text-muted-foreground hover:text-primary">
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{profile?.headline}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile?.skills?.slice(0, 6).map((s) => (
                <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {profile?.resume_filename || "Resume attached"}
            </div>
          </div>

          {errorApply?.message && <p className="text-red-500 text-sm">{errorApply.message}</p>}
          {loadingApply && <BarLoader width={"100%"} color="#36d7b7" />}
        </div>

        <DrawerFooter>
          <Button variant="blue" size="lg" onClick={onConfirmApply} disabled={loadingApply}>
            Submit Application
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ApplyJobDrawer;
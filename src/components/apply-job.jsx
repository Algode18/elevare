import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import useFetch from "@/hooks/use-fetch";
import useProfile from "@/hooks/use-profile";
import useResumes from "@/hooks/use-resumes";
import { applyWithProfile } from "@/api/apiApplications";
import { getMissingApplyFields } from "@/lib/profile-completion";
import QuickProfileDrawer from "./quick-profile-drawer";
import { BarLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { FileText, Pencil, ArrowRight, ArrowLeft } from "lucide-react";

// Apply flow: Resume Selection -> Quick Profile Check (only if fields are
// missing) -> Review -> Submit. Full profile editing lives on /profile;
// this drawer only ever asks for what's needed to submit.
const ApplyJobDrawer = ({ user, job, fetchJob, applied = false }) => {
  const { profile, isComplete, loading: loadingProfile, refetch: refetchProfile } = useProfile();
  const { resumes, defaultResume, loading: loadingResumes } = useResumes();

  const [mainOpen, setMainOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [stage, setStage] = useState("resume"); // "resume" | "review"
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  useEffect(() => {
    if (defaultResume && !selectedResumeId) setSelectedResumeId(defaultResume.id);
  }, [defaultResume, selectedResumeId]);

  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyWithProfile);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  const handleContinue = () => {
    const missing = getMissingApplyFields(profile);
    if (missing.length > 0) {
      setMainOpen(false);
      setQuickOpen(true);
    } else {
      setStage("review");
    }
  };

  const handleQuickContinue = async () => {
    setQuickOpen(false);
    await refetchProfile();
    setMainOpen(true);
    setStage("review");
  };

  const onConfirmApply = () => {
  fnApply({
    job_id: job.id,
    candidate_id: user.id,
    name: profile?.full_name || user.fullName,
    profile,
    resume: selectedResume,
  }).then(() => {
      setMainOpen(false);
      setStage("resume");
      fetchJob();
    });
  };

  // No name/skills at all yet — nothing to build an application from,
  // so this is the one case that still sends them to the full page.
  if (!loadingProfile && !isComplete) {
    return (
      <Link to={`/profile?next=/jobs/${job.id}`} className="flex-1">
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
    <>
      <Drawer open={mainOpen} onOpenChange={setMainOpen}>
        <DrawerTrigger asChild>
          <Button
            size="lg"
            variant={job?.isOpen && !applied ? "blue" : "destructive"}
            disabled={!job?.isOpen || applied || loadingProfile}
            className="flex-1"
            onClick={() => setStage("resume")}
          >
            {job?.isOpen ? (applied ? "Applied" : "Easily Apply") : "Hiring Closed"}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Apply for {job?.title} at {job?.company?.name}
            </DrawerTitle>
            <DrawerDescription>
              {stage === "resume" ? "Choose which resume to send" : "Review before submitting"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-3 p-4 pb-0">
            {stage === "resume" && (
              <div className="hairline rounded-xl p-4">
                <div className="mb-2 text-sm font-medium">Choose resume</div>
                {loadingResumes ? (
                  <BarLoader width={"100%"} color="var(--primary)" />
                ) : resumes.length === 0 ? (
                  <Link to="/resume" className="text-sm text-primary underline">
                    Upload a resume first →
                  </Link>
                ) : (
                  <RadioGroup
                    value={selectedResumeId ? String(selectedResumeId) : ""}
                    onValueChange={(val) => setSelectedResumeId(Number(val))}
                  >
                    {resumes.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-sm hover:bg-primary/5"
                      >
                        <RadioGroupItem value={String(r.id)} />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{r.title}</span>
                        {r.is_default && (
                          <span className="text-[10px] text-muted-foreground">Default</span>
                        )}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}

            {stage === "review" && (
              <>
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
                </div>

                <div className="hairline flex items-center gap-2 rounded-xl p-4 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  {selectedResume?.title || "No resume selected"}
                </div>
              </>
            )}

            {errorApply?.message && <p className="text-red-500 text-sm">{errorApply.message}</p>}
            {loadingApply && <BarLoader width={"100%"} color="var(--primary)" />}
          </div>

          <DrawerFooter>
            {stage === "resume" ? (
              <Button variant="blue" size="lg" onClick={handleContinue} disabled={!selectedResumeId} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="blue" size="lg" onClick={onConfirmApply} disabled={loadingApply}>
                  Submit Application
                </Button>
                <Button variant="outline" onClick={() => setStage("resume")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <QuickProfileDrawer
        open={quickOpen}
        onOpenChange={setQuickOpen}
        user={user}
        profile={profile}
        resumesCount={resumes.length}
        onContinue={handleQuickContinue}
      />
    </>
  );
};

export default ApplyJobDrawer;
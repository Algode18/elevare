import { useState } from "react";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import { FileText, UploadCloud, ExternalLink, CheckCircle2 } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import useProfile from "@/hooks/use-profile";
import { uploadProfileResume } from "@/api/apiProfiles";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ResumePage = () => {
  const { user, isLoaded } = useUser();
  const { profile, loading: loadingProfile, refetch } = useProfile();
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const { loading: uploading, error, fn: fnUpload } = useFetch(uploadProfileResume, {
    user_id: user?.id,
  });

  const handleFile = async (file) => {
    if (!file) return;
    const okType = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);
    if (!okType) {
      alert("Only PDF or Word documents are allowed.");
      return;
    }
    setPendingFile(file);
    await fnUpload(file);
    await refetch();
    setPendingFile(null);
  };

  if (!isLoaded || loadingProfile) {
    return <BarLoader className="mb-4" width={"100%"} color="#7c5cff" />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl">Resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One resume, reused for every "Easily Apply" application.
        </p>
      </div>

      {profile?.resume_url && (
        <div className="hairline mb-4 flex items-center gap-3 rounded-xl bg-surface/60 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {profile.resume_filename || "Your resume"}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Attached to your profile
            </div>
          </div>
          <a
            href={profile.resume_url}
            target="_blank"
            rel="noreferrer"
            className="hairline flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs hover:border-primary/50"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "hairline flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed py-12 text-center transition-colors duration-200",
          dragOver ? "border-primary bg-primary/5" : ""
        )}
      >
        <UploadCloud className={cn("h-8 w-8", dragOver ? "text-primary" : "text-muted-foreground")} />
        <div className="text-sm">
          Drag & drop a new resume, or{" "}
          <label htmlFor="resume-upload" className="cursor-pointer text-primary underline">
            browse
          </label>
        </div>
        <div className="text-xs text-muted-foreground">PDF or Word, up to 5MB</div>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {(uploading || pendingFile) && <BarLoader className="mt-4" width={"100%"} color="#7c5cff" />}
      {error?.message && <p className="mt-3 text-sm text-red-500">{error.message}</p>}

      {!profile?.resume_url && !uploading && (
        <p className="mt-4 text-xs text-muted-foreground">
          You'll also be asked for this the first time you use "Easily Apply" — uploading it here just
          gets it out of the way early.
        </p>
      )}

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link to="/profile">Edit full profile →</Link>
        </Button>
      </div>
    </div>
  );
};

export default ResumePage;

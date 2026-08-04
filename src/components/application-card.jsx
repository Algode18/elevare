import { Boxes, BriefcaseBusiness, Download, School } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import useFetch from "@/hooks/use-fetch";
import { updateApplicationStatus } from "@/api/apiApplications";
import { BarLoader } from "react-spinners";
import PipelineProgress from "./pipeline-progress";

const ApplicationCard = ({ application, isCandidate = false, jobTitle, onStatusUpdated = () => {} }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = application?.resume;
    link.target = "_blank";
    link.click();
  };

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateApplicationStatus,
    {
      job_id: application.job_id,
      id: application.id,
    }
  );

  const handleStatusChange = (status) => {
    fnHiringStatus(status).then(() => onStatusUpdated());
  };

  return (
    <Card>
      {loadingHiringStatus && <BarLoader width={"100%"} color="var(--primary)" />}
      <CardHeader>
        <CardTitle className="flex justify-between font-bold">
          {isCandidate
            ? `${application?.job?.title} at ${application?.job?.company?.name}`
            : application?.name}
          <Download
            size={18}
            className="rounded-full bg-surface-2 text-foreground h-8 w-8 p-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={handleDownload}
          />
        </CardTitle>
        {!isCandidate && jobTitle && (
          <p className="text-xs text-muted-foreground">Applied to {jobTitle}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex gap-2 items-center">
            <BriefcaseBusiness size={15} /> {application?.experience} years of
            experience
          </div>
          <div className="flex gap-2 items-center">
            <School size={15} />
            {application?.education}
          </div>
          <div className="flex gap-2 items-center">
            <Boxes size={15} /> Skills: {application?.skills}
          </div>
        </div>
        <hr />
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {new Date(application?.created_at).toLocaleString()}
          </span>
          {!isCandidate && (
            <Select onValueChange={handleStatusChange} defaultValue={application.status}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Application Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {isCandidate && (
          <div className="w-full">
            <PipelineProgress status={application.status} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;
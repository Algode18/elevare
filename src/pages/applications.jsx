import CreatedApplications from "@/components/created-applications";

const ApplicationsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="font-display text-3xl">My Applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track every application from submission to offer.
      </p>
    </div>
    <CreatedApplications />
  </div>
);

export default ApplicationsPage;

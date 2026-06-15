import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    await user
      .update({
        unsafeMetadata: { role },
      })
      .then(() => {
        navigate(role === "recruiter" ? "/post-job" : "/jobs");
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div>
      <Button
        variant="blue"
        className="h-36 text-2xl"
        onClick={() => handleRoleSelection("candidate")}
      >
        Candidate
      </Button>
      <Button
        variant="destructive"
        className="h-36 text-2xl"
        onClick={() => handleRoleSelection("recruiter")}
      >
        Recruiter
      </Button>
    </div>
  );
};

export default Onboarding;
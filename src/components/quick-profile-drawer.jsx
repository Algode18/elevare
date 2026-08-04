import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CitySelect from "@/components/city-select";
import { BarLoader } from "react-spinners";
import { ArrowRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { upsertProfile } from "@/api/apiProfiles";
import { getMissingApplyFields, getProfileCompletion } from "@/lib/profile-completion";

// Lightweight "only what's missing" check, shown during Apply instead of a
// full redirect to /profile. Saves via the same upsertProfile — Supabase
// upsert only touches the columns we send, so this never clobbers fields
// managed on the full Career Profile page.
const QuickProfileDrawer = ({ open, onOpenChange, user, profile, resumesCount, onContinue }) => {
  const navigate = useNavigate();
  const missingFields = getMissingApplyFields(profile);
  const completion = getProfileCompletion(profile, resumesCount);

  const [values, setValues] = useState({});

  useEffect(() => {
    if (open) {
      setValues({
        phone: profile?.phone || "",
        portfolio_url: profile?.portfolio_url || "",
        linkedin_url: profile?.linkedin_url || "",
        location: profile?.location || "",
      });
    }
  }, [open, profile]);

  const { loading, error, fn: fnSave } = useFetch(upsertProfile);

  const setField = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const handleSaveAndContinue = async () => {
    const payload = { user_id: user.id };
    for (const f of missingFields) payload[f.key] = values[f.key] || null;
    await fnSave(payload);
    onContinue();
  };

  // Nothing missing — skip straight through, no drawer needed.
  useEffect(() => {
    if (open && missingFields.length === 0) onContinue();
  }, [open]);

  if (missingFields.length === 0) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Complete Profile</DrawerTitle>
          <DrawerDescription>Your profile is {completion}% complete.</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4 pb-0">
          <div className="text-sm text-muted-foreground">Missing Information</div>

          {missingFields.some((f) => f.key === "phone") && (
            <div>
              <Label>Phone Number</Label>
              <Input
                className="mt-1.5"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Your phone number"
              />
            </div>
          )}

          {missingFields.some((f) => f.key === "location") && (
            <div>
              <Label>Current Location</Label>
              <CitySelect
                value={values.location}
                onChange={(v) => setField("location", v)}
                placeholder="Select your location"
                allowClear={false}
                className="mt-1.5"
              />
            </div>
          )}

          {missingFields.some((f) => f.key === "portfolio_url") && (
            <div>
              <Label>Portfolio</Label>
              <Input
                className="mt-1.5"
                value={values.portfolio_url}
                onChange={(e) => setField("portfolio_url", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          )}

          {missingFields.some((f) => f.key === "linkedin_url") && (
            <div>
              <Label>LinkedIn</Label>
              <Input
                className="mt-1.5"
                value={values.linkedin_url}
                onChange={(e) => setField("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/you"
              />
            </div>
          )}

          {error?.message && <p className="text-red-500 text-sm">{error.message}</p>}
          {loading && <BarLoader width={"100%"} color="var(--primary)" />}
        </div>

        <DrawerFooter>
          <Button onClick={handleSaveAndContinue} disabled={loading} className="gap-2">
            Save & Continue <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="text-center text-sm text-muted-foreground hover:text-primary"
          >
            Need to update experience, education or projects? Open Career Profile →
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickProfileDrawer;
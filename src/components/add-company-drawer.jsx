/* eslint-disable react/prop-types */
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useFetch from "@/hooks/use-fetch";
import { addNewCompany } from "@/api/apiCompanies";
import { BarLoader } from "react-spinners";
import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { Plus, Building2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  logo: z
    .any()
    .refine(
      (file) =>
        file[0] &&
        (file[0].type === "image/png" || file[0].type === "image/jpeg"),
      {
        message: "Only PNG or JPEG images are allowed",
      }
    ),
});

const AddCompanyDrawer = ({ fetchCompanies }) => {
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingAddCompany,
    error: errorAddCompany,
    data: dataAddCompany,
    fn: fnAddCompany,
  } = useFetch(addNewCompany);

  const onSubmit = async (data) => {
    fnAddCompany({
      ...data,
      logo: data.logo[0],
      owner_id: user?.id,
    });
  };

  useEffect(() => {
    if (dataAddCompany?.length > 0) {
      fetchCompanies();
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataAddCompany]);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant="secondary" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Company
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Add a new company
          </DrawerTitle>
          <DrawerDescription>It'll show up in the company picker for job posts right away.</DrawerDescription>
        </DrawerHeader>

        <form className="flex flex-col gap-4 p-4 pb-0">
          <div>
            <Label>Company name</Label>
            <Input placeholder="e.g. Acme Corp" className="mt-1.5" {...register("name")} />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Logo</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg"
              className="mt-1.5 file:text-muted-foreground"
              {...register("logo")}
            />
            {errors.logo && <p className="mt-1 text-sm text-red-500">{errors.logo.message}</p>}
          </div>

          {errorAddCompany?.message && (
            <p className="text-sm text-red-500">{errorAddCompany.message}</p>
          )}
          {loadingAddCompany && <BarLoader width={"100%"} color="#7c5cff" />}
        </form>

        <DrawerFooter>
          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={loadingAddCompany}>
            Add company
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddCompanyDrawer;
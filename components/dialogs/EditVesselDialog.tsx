import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getVesselTypeList,
  VesselTypeItem,
} from "@/src/services/vessel/vesselType.api";
import {
  getVesselPrincipalList,
  VesselPrincipalItem,
} from "@/src/services/vessel/vesselPrincipal.api";
import { updateVessel, getVesselCrew } from "@/src/services/vessel/vessel.api";
import { useToast } from "@/components/ui/use-toast";
import { AxiosError } from "axios";
import { UpdatedVesselFromApi } from "@/types/vessel";

interface EditVesselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vesselData: {
    vesselId: number;
    vesselCode: string;
    vesselName: string;
    vesselType: number;
    vesselTypeName: string;
    principalName: string;
    principalID: number;
    status: string;
  };
  onSuccess?: (updatedVessel: UpdatedVesselFromApi) => void;
}

export function EditVesselDialog({
  open,
  onOpenChange,
  vesselData,
  onSuccess,
}: EditVesselDialogProps) {
  const [formData, setFormData] = useState({
    vesselCode: vesselData.vesselCode,
    vesselName: vesselData.vesselName,
    vesselType: Number(vesselData.vesselType), // explicitly convert to number
    principalID: Number(vesselData.principalID), // explicitly convert to number
    status: vesselData.status,
  });

  const [vesselTypes, setVesselTypes] = useState<VesselTypeItem[]>([]);
  const [principals, setPrincipals] = useState<VesselPrincipalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [uniqueError, setUniqueError] = useState(false);
  const statusOptions = ["Active", "Inactive"];

  useEffect(() => {
    if (open) {
      setUniqueError(false); // Reset unique error state when dialog opens
      const fetchData = async () => {
        try {
          const [typesResponse, principalsResponse] = await Promise.all([
            getVesselTypeList(),
            getVesselPrincipalList(),
          ]);

          if (typesResponse.success && typesResponse.data) {
            const types = Array.isArray(typesResponse.data)
              ? typesResponse.data
              : [typesResponse.data];
            setVesselTypes(types);
          }

          if (principalsResponse.success && principalsResponse.data) {
            setPrincipals(principalsResponse.data);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [open]);

  useEffect(() => {
    setFormData({
      vesselCode: vesselData.vesselCode,
      vesselName: vesselData.vesselName,
      vesselType: Number(vesselData.vesselType),
      principalID: Number(vesselData.principalID),
      status: vesselData.status,
    });
  }, [vesselData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await updateVessel({
        vesselID: vesselData.vesselId,
        vesselCode: formData.vesselCode,
        vesselName: formData.vesselName,
        vesselType: formData.vesselType,
        vesselPrincipal: formData.principalID,
        isActive: formData.status === "Active" ? 1 : 0,
      });

      if (response.success) {
        // Get the updated crew data after successful vessel update
        const vesselCrewResponse = await getVesselCrew(vesselData.vesselId);

        toast({
          title: "Success",
          description: "Vessel updated successfully",
          variant: "success",
        });

        if (onSuccess) {
          onSuccess({
            ...response.data,
            crewData: vesselCrewResponse.success
              ? vesselCrewResponse.data
              : null,
          });
        }
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            typeof response.message === "object"
              ? JSON.stringify(response.message)
              : response.message || "Failed to update vessel",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      // Ensure error message is a string
      // const errorMessage = err.response?.data?.message;

      if (err instanceof AxiosError) {
        if (err.response?.data?.message.includes("Unique constraint failed")) {
          toast({
            title: "Error",
            description: "Vessel Code or Name already exists",
            variant: "destructive",
          });

          setUniqueError(true);
          return;
        }
      }

      toast({
        title: "Error",
        description: "Failed to update vessel",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <div className="p-6 pb-8">
          <div className="flex justify-center items-center mb-8">
            <DialogTitle className="text-2xl font-semmibold text-primary">
              Edit Vessel
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-2 col-span-2">
                <label
                  htmlFor="vesselCode"
                  className={`block text-sm font-medium ${
                    uniqueError ? "text-red-500 focus:ring-red-500" : ""
                  }`}
                >
                  Vessel Code
                </label>
                <Input
                  id="vesselCode"
                  name="vesselCode"
                  value={formData.vesselCode}
                  onChange={handleInputChange}
                  className={`w-full ${uniqueError ? "border-red-500" : ""}`}
                  placeholder="Enter vessel code"
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium">
                  Status
                </label>
                <Select
                  name="status"
                  value={formData.status.toString()}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {vesselTypes.find(
                        (type) => type.status === formData.status
                      )?.status || vesselData.status}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div> */}

              <div className="space-y-2 col-span-2">
                <label
                  htmlFor="vesselName"
                  className={`block text-sm font-medium ${
                    uniqueError ? "text-red-500 focus:ring-red-500" : ""
                  }`}
                >
                  Vessel Name
                </label>
                <Input
                  id="vesselName"
                  name="vesselName"
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  className={`w-full ${uniqueError ? "border-red-500" : ""}`}
                  placeholder="Enter vessel name"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label
                  htmlFor="vesselType"
                  className="block text-sm font-medium"
                >
                  Vessel Type
                </label>
                <Select
                  name="vesselType"
                  value={formData.vesselType.toString()}
                  onValueChange={(value) =>
                    handleSelectChange("vesselType", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {vesselTypes.find(
                        (type) => type.VesselTypeID === formData.vesselType
                      )?.VesselTypeName || vesselData.vesselTypeName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vesselTypes.map((type) => (
                      <SelectItem
                        key={type.VesselTypeID}
                        value={type.VesselTypeID.toString()}
                      >
                        {type.VesselTypeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <label
                  htmlFor="principalID"
                  className="block text-sm font-medium"
                >
                  Principal Name
                </label>
                <Select
                  name="principalID"
                  value={formData.principalID.toString()}
                  onValueChange={(value) =>
                    handleSelectChange("principalID", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {principals.find(
                        (principal) =>
                          principal.PrincipalID === formData.principalID
                      )?.PrincipalName || vesselData.principalName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {principals.map((principal) => (
                      <SelectItem
                        key={principal.PrincipalID}
                        value={principal.PrincipalID.toString()}
                      >
                        {principal.PrincipalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex gap-4 pt-6">
              <DialogClose asChild onClick={() => setUniqueError(false)}>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-gray-300 rounded-md text-black hover:bg-gray-100 hover:text-black"
                  onClick={() => setUniqueError(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {isSubmitting ? "Updating..." : "Update Vessel"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

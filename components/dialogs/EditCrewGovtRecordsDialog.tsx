"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { updateCrew, CrewItem, UpdateCrewDataForm } from "@/src/services/crew/crew.api";
import { Save } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema with sanitization
const crewGovtSchema = z.object({
  sssNumber: z
    .string()
    .refine((val) => val.replace(/\D/g, "").length === 10, {
      message: "Must be 10 digits",
    })
    .optional(),

  tinNumber: z
    .string()
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 12;
    }, {
      message: "Must be 9 to 12 digits",
    })
    .optional(),

  philhealthNumber: z
    .string()
    .refine((val) => val.replace(/\D/g, "").length === 12, {
      message: "Must be 12 digits",
    })
    .optional(),

  hdmfNumber: z
    .string()
    .refine((val) => val.replace(/\D/g, "").length === 12, {
      message: "Must be 12 digits",
    })
    .optional(),
});

type CrewGovtFormData = z.infer<typeof crewGovtSchema>;

interface EditCrewGovtRecordsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewGovtTypeData: CrewItem;
  onSuccess?: (data: Partial<UpdateCrewDataForm>) => void;
  setSelectedCrewData?: React.Dispatch<React.SetStateAction<CrewItem | null>>;
}

//  Maps backend data to form format
const mapCrewDataToForm = (data: CrewItem): CrewGovtFormData => ({
  sssNumber: data.SSSNumber || undefined,
  tinNumber: data.TaxIDNumber || undefined,
  philhealthNumber: data.PhilHealthNumber || undefined,
  hdmfNumber: data.HDMFNumber || undefined,
});

export function EditCrewGovtRecordsDialog({
  open,
  onOpenChange,
  crewGovtTypeData,
  onSuccess,
}: EditCrewGovtRecordsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CrewGovtFormData>({
    resolver: zodResolver(crewGovtSchema),
    defaultValues: mapCrewDataToForm(crewGovtTypeData),
  });

  const { reset } = form;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset(mapCrewDataToForm(crewGovtTypeData));
    }
  }, [open, crewGovtTypeData, reset]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  const onSubmit = async (values: CrewGovtFormData) => {
    setIsSubmitting(true);

    try {
      // Allow only optional keys from UpdateCrewDataForm
      const payload: Partial<UpdateCrewDataForm> = {};

      if (values.sssNumber?.trim() !== crewGovtTypeData.SSSNumber) {
        payload.sssNumber = values.sssNumber; // send as-is (with spaces/dashes)
      }

      if (values.tinNumber?.trim() !== crewGovtTypeData.TaxIDNumber) {
        payload.tinNumber = values.tinNumber;
      }

      if (values.philhealthNumber?.trim() !== crewGovtTypeData.PhilHealthNumber) {
        payload.philhealthNumber = values.philhealthNumber;
      }

      if (values.hdmfNumber?.trim() !== crewGovtTypeData.HDMFNumber) {
        payload.hdmfNumber = values.hdmfNumber;
      }

      // updateCrew should accept Partial<UpdateCrewDataForm>
      const response = await updateCrew(crewGovtTypeData.CrewCode, payload);

      if (response.success) {
        toast({
          title: "Success",
          description: "Deduction description updated successfully.",
          variant: "success",
        });

        // onSuccess should also accept Partial<UpdateCrewDataForm>
        onSuccess?.(payload);
      } else {
        console.warn("API returned failure response:", response);
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An error occurred while updating the deduction.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC] p-10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Crew Government Records
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 mt-3 mb-6">
              {[
                ["sssNumber", "SSS Number"],
                ["philhealthNumber", "PhilHealth Number"],
                ["tinNumber", "Tax ID Number"],
                ["hdmfNumber", "HDMF Number"],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof CrewGovtFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600 font-medium">
                        {label}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder={`Enter ${label}`}
                          className="border border-[#E0E0E0] rounded-md"
                          {...field}
                          value={field.value ?? ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

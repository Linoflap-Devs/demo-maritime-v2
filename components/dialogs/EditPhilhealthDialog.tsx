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
import {
  PHILHEALTHDeductionRate,
  updateDeductionGovtRates,
} from "@/src/services/deduction/governmentDeduction.api";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const philHealthSchema = z
  .object({
    contributionId: z.number(),
    year: z.coerce.number(),
    salaryFrom: z.coerce
      .number()
      .min(0, "Salary From must be a positive number"),
    salaryTo: z.coerce.number().min(0, "Salary To must be a positive number"),
    premium: z.coerce.number(),
    //premiumRate: z.coerce.number()
    premiumRate: z.coerce.number().max(1, "Must be a decimal between 0 and 1"),
  })
  .refine((data) => data.salaryFrom <= data.salaryTo, {
    message: "Salary From must be less than or equal to Salary To",
    path: ["salaryFrom"],
  });

type PhilHealthFormData = z.infer<typeof philHealthSchema>;

interface EditPhilHealthRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  PhilHealthvesselTypeData: PHILHEALTHDeductionRate;
  onSuccess?: (updatedRate: PHILHEALTHDeductionRate) => void;
}

export function EditPhilHealthRateDialog({
  open,
  onOpenChange,
  PhilHealthvesselTypeData,
  onSuccess,
}: EditPhilHealthRateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PhilHealthFormData>({
    resolver: zodResolver(philHealthSchema),
    defaultValues: {
      contributionId: PhilHealthvesselTypeData.contributionId ?? 0,
      year: PhilHealthvesselTypeData.Year,
      salaryFrom: PhilHealthvesselTypeData.salaryFrom,
      salaryTo: PhilHealthvesselTypeData.salaryTo,
      premium: PhilHealthvesselTypeData.premium,
      premiumRate: PhilHealthvesselTypeData.premiumRate,
    },
  });

  const { reset } = form;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  const onSubmit = async (values: PhilHealthFormData) => {
    setIsSubmitting(true);
    //const convertedPremiumRate = values.premiumRate / 100;

    try {
      const response = await updateDeductionGovtRates({
        contributionId: values.contributionId,
        type: "PHILHEALTH",
        data: {
          contributionId: values.contributionId,
          year: values.year,
          salaryFrom: values.salaryFrom,
          salaryTo: values.salaryTo,
          eePremium: values.premium,
          eePremiumRate: values.premiumRate,
        },
      });

      if (response.success) {
        toast({
          title: "Philhealth Deduction Updated",
          description:
            "The Philhealth deduction rate has been successfully updated.",
          variant: "success",
        });

        onSuccess?.({
          contributionId: values.contributionId,
          Year: values.year,
          salaryFrom: values.salaryFrom,
          salaryTo: values.salaryTo,
          premium: values.premium,
          premiumRate: values.premiumRate,
        });

        onOpenChange(false);
      } else {
        throw new Error("Failed to update Philhealth contribution.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC] p-10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Philhealth Contribution Rate
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Year Field */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {[
                ["salaryFrom", "Salary From"],
                ["salaryTo", "Salary To"],
                ["premium", "EE Premium"],
                ["premiumRate", "EE Premium Rate"],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof PhilHealthFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600 font-medium">
                        {label}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={`Enter ${label}`}
                          className="border border-[#E0E0E0] rounded-md"
                          {...field}
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
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
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
                    <Pencil className="w-4 h-4 mr-2" />
                    Update Philhealth Contribution
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

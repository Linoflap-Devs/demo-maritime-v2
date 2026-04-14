"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { toast } from "../ui/use-toast";
import { addDeductionGovtRates, PHILHEALTHDeductionRate } from "@/src/services/deduction/governmentDeduction.api";
import { cn } from "@/lib/utils";

interface PHILHEALTHDeductionFormValues {
  year: string | number;
  salaryFrom: string | number;
  salaryTo: string | number;
  eePremium: string | number;
  eePremiumRate: string | number;
}

export const formSchema = z.object({
  contributionId: z.number().optional(),
  year: z
    .string()
    .min(1, "Please enter the year")
    .refine((val) => !isNaN(Number(val)), {
      message: "Year must be a valid number",
    }),

  salaryFrom: z
    .string()
    .min(1, "Please enter salary from")
    .min(0, "Salary From must be a positive number")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Salary From must be a number greater than 0",
    }),

  salaryTo: z
    .string()
    .min(1, "Please enter salary to")
    .min(0, "Salary To must be a positive number")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Salary To must be a number greater than 0",
    }),

  eePremium: z
    .string()
    .min(1, "Please enter EE Premium")
    .refine((val) => !isNaN(Number(val)), {
      message: "EE Premium must be a number",
    }),
  eePremiumRate: z
    .string()
    .min(1, "Please enter EE Premium Rate")
    .refine((val) => !isNaN(Number(val)), {
      message: "EE Premium Rate must be a number",
    }),
})
  .refine((data) => data.salaryFrom <= data.salaryTo, {
    message: "Salary From must be less than or equal to Salary To",
    path: ["salaryFrom"],
  });

interface AddPhilhealthRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newRate: PHILHEALTHDeductionRate) => void;
}

export function AddPhilhealthRateDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPhilhealthRateDialogProps) {
  const form = useForm<PHILHEALTHDeductionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: "",
      salaryFrom: "",
      salaryTo: "",
      eePremium: "",
      eePremiumRate: "",
    },
  });

  type PHILHEALTHDeductionFormValues = z.infer<typeof formSchema>;
  const { reset, formState } = form;
  const { isSubmitting } = formState;
  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: PHILHEALTHDeductionFormValues) => {
    try {
        const payload = {
          contributionId: Number(data.contributionId),
          type: "PHILHEALTH" as const,
          year: Number(data.year) || 0,
          salaryFrom: Number(data.salaryFrom) || 0,
          salaryTo: Number(data.salaryTo) || 0,
          eePremium: Number(data.eePremium) || 0,
          eePremiumRate: Number(data.eePremiumRate) || 0,
        };
      const response = await addDeductionGovtRates(payload);

      if (response && response.success) {
        const newRate: PHILHEALTHDeductionRate = {
          salaryFrom: Number(data.salaryFrom),
          salaryTo: Number(data.salaryTo),
          premium: Number(data.eePremium),
          premiumRate: Number(data.eePremiumRate),
          Year: Number(data.year),
        };

        onSuccess?.(newRate);
        onOpenChange(false);
        reset();

        toast({
          title: "PhilHealth Deduction Added",
          description: "The PhilHealth deduction rate has been successfully added.",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to add PhilHealth deduction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding PhilHealth deduction:", error);
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC] p-10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Add Philhealth Contribution Rate
          </DialogTitle>
          {/* <DialogDescription className="text-center text-sm text-gray-600">
            Add a new remittance entry for the selected allottee
          </DialogDescription> */}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field, fieldState }) => (
                <FormItem className="w-full gap-1">
                  <FormLabel className="text-sm text-gray-600 font-medium">
                    Select Year
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4 my-6">
              <FormField
                control={form.control}
                name="salaryFrom"
                render={({ field }) => (
                  <FormItem className="w-full gap-1">
                    <FormLabel className="text-sm text-gray-600 font-medium">
                      Salary From
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter Salary From"
                        className="border border-[#E0E0E0] rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryTo"
                render={({ field }) => (
                  <FormItem className="w-full gap-1">
                    <FormLabel className="text-sm text-gray-600 font-medium">
                      Salary To
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter Salary To"
                        className="border border-[#E0E0E0] rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 my-6">
              <FormField
                control={form.control}
                name="eePremium"
                render={({ field }) => (
                  <FormItem className="w-full gap-1">
                    <FormLabel className="text-sm text-gray-600 font-medium">
                      EE Premium
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter EE Premium"
                        className="border border-[#E0E0E0] rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eePremiumRate"
                render={({ field }) => (
                  <FormItem className="w-full gap-1">
                    <FormLabel className="text-sm text-gray-600 font-medium">
                      EE Premium Rate
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter EE Premium Rate"
                        className="border border-[#E0E0E0] rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Philhealth year
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

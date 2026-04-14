import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Info } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "../ui/use-toast";
import { DeductionEntries, updateCrewDeductionEntry } from "@/src/services/deduction/crewDeduction.api";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const formSchema = z.object({
  deductionAmount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "Number must be greater than 0",
    }),

  deductionRemarks: z.string().optional(),
  //status: z.number().min(0, "Status is required"),
  deductionDate: z.string().min(1, "Deduction date is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deduction: DeductionEntries;
  crewCode: string;
  setOnSuccess: Dispatch<SetStateAction<boolean>>;
}

export function EditDeductionDialog({
  open,
  onOpenChange,
  deduction,
  setOnSuccess,
  crewCode,
}: EditDeductionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthMap: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deductionAmount: deduction.Amount || 0,
      deductionRemarks: deduction.Remarks || "",
      deductionDate:
        deduction.Month && deduction.Year
          ? new Date(deduction.Year, monthMap[deduction.Month], 2)
            .toISOString()
            .split("T")[0]
          : "",

    },
  });

  useEffect(() => {
    form.reset({
      deductionAmount: deduction.Amount || 0,
      deductionRemarks: deduction.Remarks || "",
      deductionDate:
        deduction.Month && deduction.Year
          ? new Date(deduction.Year, monthMap[deduction.Month], 2)
            .toISOString()
            .split("T")[0]
          : "",
    });
  }, [deduction, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        deductionAmount: Number(values.deductionAmount),
        deductionDate: new Date(values.deductionDate),
        status: 0,
      };

      const response = await updateCrewDeductionEntry(
        crewCode,
        deduction.DeductionDetailID,
        payload
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Deduction updated successfully.",
          variant: "success",
        });
        setOnSuccess(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to update deduction.",
          variant: "destructive",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating deduction (catch block):", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Error updating deduction.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Deduction Entry
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6"
          >
            <FormField
              control={form.control}
              name="deductionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600 flex items-center gap-2">
                    Deduction Date
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger asChild>
                        <Info className="w-4 h-4 cursor-pointer transition-colors text-gray-400 hover:text-primary" />
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="center"
                        className="w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-xl text-sm text-gray-700 z-50"
                      >
                        Please edit the date if needed.
                        <br />
                        Default is the 1st day of the selected month.
                      </HoverCardContent>
                    </HoverCard>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deductionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deductionRemarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="status"
              render={({ field }) => {
                console.log("statusMap entries:", Object.entries(statusMap));
                console.log("field value:", field.value);

                return (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="h-40">
                          {Object.entries(statusMap).map(([label, value]) => (
                            <SelectItem key={value} value={value.toString()}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            /> */}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm h-11"
                onClick={() => onOpenChange(false)}
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
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
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

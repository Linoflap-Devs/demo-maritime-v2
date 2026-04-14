import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  DeductionDescriptionItem,
  getDeductionDescriptionList,
} from "@/src/services/deduction/deductionDescription.api";
import { Loader2, Plus } from "lucide-react";
import { addCrewDeductionEntry } from "@/src/services/deduction/crewDeduction.api";
import { useSearchParams } from "next/navigation";
import { toast } from "../ui/use-toast";

const deductionFormSchema = z.object({
  deductionId: z.string().min(1, "Deduction type is required"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .min(1, "Amount must be greater than 0"),
  remarks: z.string().min(1, "Remarks are required"),
  deductionDate: z.string().min(1, "Deduction date is required"),
  status: z
    .enum(["0", "1", "2", "3", "5"], {
      errorMap: () => ({ message: "Status is required" }),
    })
    .optional(),
});

type DeductionFormValues = z.infer<typeof deductionFormSchema>;

interface AddDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOnSuccess: Dispatch<SetStateAction<boolean>>;
}

export function AddDeductionDialog({
  open,
  onOpenChange,
  setOnSuccess,
}: AddDeductionDialogProps) {
  const [deductionDescription, setDeductionDescription] = useState<
    DeductionDescriptionItem[]
  >([]);

  const params = useSearchParams();
  const crewCode = params.get("crewCode");

  useEffect(() => {
    if (open) {
      getDeductionDescriptionList()
        .then((response) => setDeductionDescription(response.data))
        .catch((error) => {
          console.error("Error fetching deduction descriptions:", error);
        });
    }
  }, [open]);

  const form = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionFormSchema),
    defaultValues: {
      deductionId: "",
      amount: undefined,
      remarks: "",
      deductionDate: "",
      status: undefined,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = form;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const onSubmit = async (data: DeductionFormValues) => {
    if (!crewCode) {
      console.error("Crew code is required");
      return;
    }

    const payload = {
      deductionID: Number(data.deductionId),
      deductionAmount: data.amount,
      deductionRemarks: data.remarks || "",
      deductionStatus: 0,
      deductionDate: data.deductionDate,
    };

    try {
      const response = await addCrewDeductionEntry(crewCode, payload);

      if (response.success) {
        toast({
          title: "Deduction added successfully",
          description: `Deduction has been added.`,
          variant: "success",
        });
        setOnSuccess(true);
        handleOpenChange(false);
      } else {
        console.warn("API responded with error:", response.message);
        toast({
          title: "Error adding deduction",
          description:
            response.message ||
            "An error occurred while adding the deduction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during API call:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding the deduction.",
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Add Deduction
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="mt-3 space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off">

            <FormField
              control={form.control}
              name="deductionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">Deduction Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className={`border border-[#E0E0E0] rounded-md ${errors.deductionDate ? "border-red-500" : ""}`}
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
              name="deductionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Deduction
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}>
                      <SelectTrigger
                        className={`w-full border border-[#E0E0E0] rounded-md ${errors.deductionId ? "border-red-500" : ""
                          }`}>
                        <SelectValue placeholder="Select deduction type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[24rem] overflow-y-auto text-sm">
                        {deductionDescription.map((item) => (
                          <SelectItem
                            key={item.DeductionID}
                            value={item.DeductionID.toString()}>
                            {item.DeductionName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      className="border border-[#E0E0E0] rounded-md"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Remarks
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter remarks"
                      className="border border-[#E0E0E0] rounded-md"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Status
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}>
                      <SelectTrigger
                        className={`w-full border border-[#E0E0E0] rounded-md ${
                          errors.status ? "border-red-500" : ""
                        }`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Pending</SelectItem>
                        <SelectItem value="1">Completed</SelectItem>
                        <SelectItem value="2">Declined</SelectItem>
                        <SelectItem value="3">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm h-11"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deduction
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

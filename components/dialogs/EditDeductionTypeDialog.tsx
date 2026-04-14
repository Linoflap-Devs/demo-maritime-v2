import { useState, useEffect, Dispatch, SetStateAction } from "react"; // Add useEffect import
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";
import {
  DeductionDescriptionItem,
  editDeductionDescription,
} from "@/src/services/deduction/deductionDescription.api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "../ui/use-toast";

// Define the form schema with Zod
const formSchema = z.object({
  deductionCode: z.string().min(1, "Deduction code is required"),
  deductionName: z.string().min(1, "Deduction name is required"),
  deductionType: z.string().min(1, "Deduction type is required"),
  currency: z.string().min(1, "Currency is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDeductionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deduction: DeductionDescriptionItem;
  setOnSuccess: Dispatch<SetStateAction<boolean>>;
}

export function EditDeductionTypeDialog({
  open,
  onOpenChange,
  deduction,
  setOnSuccess,
}: EditDeductionTypeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deductionCode: deduction.DeductionCode,
      deductionName: deduction.DeductionName,
      deductionType: String(deduction.DeductionType),
      currency: String(deduction.DeductionCurrency),
    },
  });

  useEffect(() => {
    form.reset({
      deductionCode: deduction.DeductionCode,
      deductionName: deduction.DeductionName,
      deductionType: String(deduction.DeductionType),
      currency: String(deduction.DeductionCurrency),
    });
  }, [deduction, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        deductionCode: values.deductionCode,
        deductionName: values.deductionName,
        deductionType: Number(values.deductionType),
        currency: values.currency,
      };

      await editDeductionDescription(deduction.DeductionID, payload)
        .then((response) => {
          if (response.success) {
            toast({
              title: "Success",
              description: "Deduction description updated successfully.",
              variant: "success",
            });
            setOnSuccess(true);
          } else {
            toast({
              title: "Error",
              description: "Failed to update deduction description.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description:
              error.message ||
              "An error occurred while updating the deduction.",
            variant: "destructive",
          });
        });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating deduction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Deduction Description
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="deductionCode"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">
                    Deduction Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border border-[#E0E0E0] rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deductionName"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">
                    Deduction Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border border-[#E0E0E0] rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deductionType"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">
                    Deduction Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select deduction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Common Deduction</SelectItem>
                      <SelectItem value="2">Loan Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">
                    Currency
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">PHP</SelectItem>
                      <SelectItem value="2">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm h-11"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Description
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

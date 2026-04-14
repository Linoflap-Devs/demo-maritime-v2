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
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";

import { AxiosError } from "axios";
import {
  AddForexPayload,
  addWageForex,
  WageForexItem,
} from "@/src/services/wages/wageForex.api";

interface AddForexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newUser: WageForexItem) => void;
}

// Form validation schema
const formSchema = z.object({
  year: z
    .number({
      required_error: "Year is required.",
      invalid_type_error: "Year must be a number",
    })
    .min(2000, "Year must be 2000 or later"),
  month: z
    .number({
      required_error: "Month is required.",
      invalid_type_error: "Month must be a number",
    })
    .min(1, "Month is required. "),
  rate: z
    .number({
      required_error: "Exchange rate is required.",
      invalid_type_error: "Exchange rate must be a number.",
    })
    .positive("Exchange rate must be greater than 0."),
});

type ForexFormValues = z.infer<typeof formSchema>;

export function AddForexDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddForexDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueError, setUniqueError] = useState<boolean>(false);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const form = useForm<ForexFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: undefined,
      rate: 0,
    },
  });
  const { reset, formState } = form;

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = async (data: ForexFormValues) => {
    try {
      setIsSubmitting(true);

      const payload: AddForexPayload = {
        year: data.year,
        month: data.month,
        rate: data.rate,
      };

      const response = await addWageForex(payload);
      const responseData = response?.data as any;

      if (response?.success && responseData) {
        onSuccess(responseData);

        toast({
          title: "Success",
          description: response?.message || "Forex added successfully.",
          variant: "success",
        });

        onOpenChange(false);
        reset();
      } else {
        toast({
          title: "Error",
          description: response?.message || "No forex data returned.",
          variant: "destructive",
        });

        console.error("Backend validation error:", response);
      }
    } catch (err: unknown) {
      const error = err as AxiosError;

      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        "An unexpected error occurred.";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      console.error("Axios error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        form.reset();
        onOpenChange(false);
        setUniqueError(false);
      }}
    >
      <DialogContent className="p-6 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Add Forex
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2000"
                      placeholder="e.g. 2025"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || "")
                      }
                      className="border border-[#E0E0E0] rounded-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">Month</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="h-60">
                      {months
                      .map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">
                    Exchange Rate
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || "")
                      }
                      className="border border-[#E0E0E0] rounded-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-sm h-11"
                onClick={() => onOpenChange(false)}
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
                    Add Forex
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

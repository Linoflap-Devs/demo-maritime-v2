"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pen, Save } from "lucide-react";
import { useEffect } from "react";
import { toast } from "../ui/use-toast";
import { cn } from "@/lib/utils";
import {
  PaymentReferenceItem,
  updatedPaymentReference,
  UpdatePaymentReferencePayload,
} from "@/src/services/payment-reference/payment-reference.api";

// Validation schema
const paymentReferenceSchema = z.object({
  payMonth: z.string().min(1, "Month is required"),
  payYear: z.string().min(1, "Year is required"),
  deductionType: z.string().min(1, "Deduction type is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  referenceNumber: z.string().min(1, "Reference number is required"),
});

type PaymentFormValues = z.infer<typeof paymentReferenceSchema>;

interface EditiPaymentReferenceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentReferenceData: PaymentReferenceItem;
  onSuccess: (newPayment: PaymentReferenceItem) => void;
}

export function EditPaymentReference({
  open,
  onOpenChange,
  onSuccess,
  paymentReferenceData,
}: EditiPaymentReferenceProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentReferenceSchema),
    defaultValues: {
      payMonth: "",
      payYear: "",
      deductionType: "",
      amount: "",
      referenceNumber: "",
    },
  });

  const { reset, formState } = form;
  const { isSubmitting } = formState;

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

  const years = Array.from(
    { length: 8 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (open && paymentReferenceData) {
      form.reset({
        payMonth: paymentReferenceData.PayMonth?.toString() || "",
        payYear: paymentReferenceData.PayYear?.toString() || "",
        deductionType: paymentReferenceData.DeductionType || "",
        amount: paymentReferenceData.Amount?.toString() || "",
        referenceNumber: paymentReferenceData.PaymentReferenceNumber || "",
      });
    }
  }, [open, paymentReferenceData, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const payload: UpdatePaymentReferencePayload = {
        payMonth: Number(data.payMonth),
        payYear: Number(data.payYear),
        deductionType: data.deductionType,
        amount: parseFloat(data.amount),
        referenceNumber: data.referenceNumber,
        paymentReferenceId: paymentReferenceData.PaymentReferenceID,
      };

      const response = await updatedPaymentReference(payload);

      if (response?.success) {
        const createdItem = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        onSuccess(createdItem);

        toast({
          title: "Payment Reference Updated",
          description: "The payment reference has been successfully updated.",
          variant: "success",
        });

        onOpenChange(false);
        reset();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to edit payment reference",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#FCFCFC] p-10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Payment Reference
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Month */}
            <FormField
              control={form.control}
              name="payMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">Month</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="h-60">
                      {months.map((month, index) => (
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

            {/* Year */}
            <FormField
              control={form.control}
              name="payYear"
              render={({ field, fieldState }) => (
                <FormItem className="w-full gap-1">
                  <FormLabel className="text-sm text-gray-600 font-medium">
                    Year
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Deduction Type */}
            <FormField
              control={form.control}
              name="deductionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Deduction Type
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deduction type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
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
                      step="0.01"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Number */}
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Reference Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reference number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
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

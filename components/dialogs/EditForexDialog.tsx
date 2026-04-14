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
import { Loader2, Pencil, Save } from "lucide-react";
import {
  editWageForex,
  IEditWagePayload,
} from "@/src/services/wages/wageForex.api";
import { toast } from "../ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dispatch, SetStateAction, useState } from "react";

// Form schema with validation
const formSchema = z.object({
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  exchangeRate: z.number().positive(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditForexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forex: {
    id: number;
    year: number;
    month: number;
    exchangeRate: number;
  };
  setOnSuccess: Dispatch<SetStateAction<boolean>>;
}

export function EditForexDialog({
  open,
  onOpenChange,
  forex,
  setOnSuccess,
}: EditForexDialogProps) {
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
  const [loading, setLoading] = useState(false);

  // Set up form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: forex.year,
      month: forex.month,
      exchangeRate: forex.exchangeRate,
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: IEditWagePayload = {
      exchangeRateMonth: values.month,
      exchangeRateYear: values.year,
      exchangeRate: values.exchangeRate,
    };

    setLoading(true);
    editWageForex(forex.id, payload)
      .then((res) => {
        if (res.success) {
          toast({
            title: "Success",
            description: "Forex data saved successfully.",
            variant: "success",
          });
          setOnSuccess(true);
          onOpenChange(false);
        } else {
          toast({
            title: "Error",
            description: res.message || "Failed to save forex data.",
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        console.error("Error saving forex data:", err);
        toast({
          title: "Error",
          description: "Failed to save forex data.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Forex
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="text-sm text-gray-600">Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <FormField
              control={form.control}
              name="exchangeRate"
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Forex
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

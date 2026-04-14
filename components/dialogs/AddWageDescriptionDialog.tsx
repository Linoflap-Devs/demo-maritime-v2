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
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dispatch, SetStateAction, useState } from "react";
import { addWageDescription } from "@/src/services/wages/wageDescription.api";
import { AxiosError } from "axios";

interface AddWageDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOnSuccessAdd: Dispatch<SetStateAction<boolean>>;
}

// Form validation schema
const formSchema = z.object({
  wageCode: z.string().min(1, "Wage code is required"),
  wageName: z.string().min(1, "Wage name is required"),
  payableOnBoard: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddWageDescriptionDialog({
  open,
  onOpenChange,
  setOnSuccessAdd,
}: AddWageDescriptionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueError, setUniqueError] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wageCode: "",
      wageName: "",
      payableOnBoard: false,
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    setUniqueError(false);
    setIsSubmitting(true);
    const AddWageDescriptionPayload = {
      wageCode: values.wageCode.trim(),
      wageName: values.wageName.trim(),
      wagePayableOnBoard: values.payableOnBoard ? 1 : 0,
    };

    addWageDescription(AddWageDescriptionPayload)
      .then(() => {
        toast({
          title: "Success",
          description: "Wage description added successfully",
          variant: "success",
        });

        form.reset();
        onOpenChange(false);
        setOnSuccessAdd(true);
      })
      .catch((error) => {
        const err = error as Error;
        if (err instanceof AxiosError) {
          toast({
            title: "Error",
            description:
              err.response?.data.message ||
              "Failed to add wage description. Please try again.",
            variant: "destructive",
          });

          setUniqueError(true);
          return;
        } else {
          toast({
            title: "Error",
            description: err.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        form.reset();
        onOpenChange(false);
        setUniqueError(false);
      }}>
      <DialogContent className="p-6 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <DialogHeader> 
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Add Wage Description
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="wageCode"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel
                    className={`text-sm text-gray-600 ${
                      uniqueError ? "text-destructive" : ""
                    }`}>
                    Wage Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border border-[#E0E0E0] rounded-md ${
                        uniqueError
                          ? "border-destructive focus:!ring-destructive/50"
                          : ""
                      }`}
                      placeholder="Enter wage code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wageName"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel
                    className={`text-sm text-gray-600 ${
                      uniqueError ? "text-destructive" : ""
                    }`}>
                    Wage Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border border-[#E0E0E0] rounded-md ${
                        uniqueError
                          ? "border-destructive focus:!ring-destructive/50"
                          : ""
                      }`}
                      placeholder="Enter wage name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payableOnBoard"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm text-gray-600">
                    Payable On Board
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "yes")}
                    defaultValue={field.value ? "yes" : "no"}>
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue
                          className="w-full"
                          placeholder="Select option"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full">
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
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
                    <Loader2 className="animate-spin" />
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

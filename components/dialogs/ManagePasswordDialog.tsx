import { FormProvider, useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "../ui/use-toast";
import { updatePasswordAdmin } from "@/src/services/users/users.api";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export interface ManagePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  onSuccess?: () => void;
}

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type UpdatePasswordForm = z.infer<typeof passwordSchema>;

export default function ManagePasswordDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: ManagePasswordDialogProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
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

  const onSubmit = async (data: UpdatePasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    console.log("Form data:", data);

    try {
      setIsSubmitting(true);

      const result = await updatePasswordAdmin({
        userId: userId,
        newPassword: data.newPassword,
      });

      console.log("API result:", result);

      if (result.success) {
        console.log("Password updated successfully");
        toast({
          title: "Success",
          description: "Password updated successfully.",
          variant: "success",
        });
        form.reset();
        handleOpenChange(false);

        if (onSuccess) onSuccess();
      } else {
        console.log("Error updating password:", result.message);
        toast({
          title: "Error",
          description: result.message || "Failed to update password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Unexpected error:", error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
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
            New Password - {userName}
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter New Password"
                        {...field}
                        className={
                          fieldState.invalid
                            ? "border-red-500 focus-visible:ring-red-300 focus-visible:border-transparent"
                            : ""
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        {...field}
                        className={
                          fieldState.invalid
                            ? "border-red-500 focus-visible:ring-red-300 focus-visible:border-transparent"
                            : ""
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
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
                    <Pencil className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

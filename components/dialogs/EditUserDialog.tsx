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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateUserPayload,
  UsersItem,
  updateUser,
} from "@/src/services/users/users.api";

const editUserSchema = z.object({
  email: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().optional(),
  role: z.coerce
    .number({ required_error: "Please select a role" })
    .refine((val) => !isNaN(val), {
      message: "Please select a valid role",
    }),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  SelectedUserData: UsersItem;
  onSuccess?: (updatedUser: UsersItem) => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  SelectedUserData,
  onSuccess,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const roleOptions = [
    { label: "System Admin", value: 1 },
    { label: "Payroll Admin", value: 3 },
    { label: "Payroll Staff", value: 4 },
    { label: "Accounting Staff", value: 5 },
  ];

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      role: undefined,
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

  useEffect(() => {
    if (open && SelectedUserData) {
      const [firstName = "", lastName = ""] = SelectedUserData.Name.split(" ");

      form.reset({
        email: SelectedUserData.Email ?? "",
        firstName,
        lastName,
        password: "",
        role: SelectedUserData.UserType,
      });
    }
  }, [open, SelectedUserData]);

  const onSubmit = async (values: EditUserFormData) => {
    setIsSubmitting(true);
    try {
      const payload: UpdateUserPayload = {
        userId: SelectedUserData.UserID,
        firstName: values.firstName,
        lastName: values.lastName,
        userType: values.role,
      };

      const response = await updateUser(payload);

      if (response.success) {
        toast({
          title: "User Updated",
          description: "User information has been updated successfully.",
          variant: "success",
        });

        const updatedUser = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        onSuccess?.(updatedUser);
        onOpenChange(false);
      } else {
        throw new Error("Failed to update user.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
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
            Edit User
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={
                        field.value !== undefined
                          ? field.value.toString()
                          : undefined
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10 gap-1",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem
                            key={role.value}
                            value={role.value.toString()}
                          >
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
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
                    Update User
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

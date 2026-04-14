"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Updated import
import {
  SalaryScaleItem,
  UpdateSalaryScalePayload,
  updateSalaryScale,
} from "../../src/services/wages/salaryScale.api"; // Ensure path is correct

export interface DialogSelectOption {
  id: number;
  name: string;
}

interface EditSalaryScaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaryScale: SalaryScaleItem | null;
  ranks: DialogSelectOption[];
  wageTypes: DialogSelectOption[];
  onUpdateSuccess: (updatedItem: SalaryScaleItem) => void;
}

export function EditSalaryScaleDialog({
  open,
  onOpenChange,
  salaryScale,
  ranks,
  wageTypes,
  onUpdateSuccess,
}: EditSalaryScaleDialogProps) {
  const { toast } = useToast(); // Use the shadcn/ui toast hook
  const [currentRankId, setCurrentRankId] = useState<string>("");
  const [currentWageTypeId, setCurrentWageTypeId] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (salaryScale) {
      setCurrentRankId(salaryScale.RankID.toString());
      setCurrentWageTypeId(salaryScale.WageID.toString());
      setCurrentAmount(salaryScale.WageAmount.toString());
      setError(null);
    }
  }, [salaryScale, open]);

  const handleSaveChanges = async () => {
    if (!salaryScale) return;
    setError(null);

    const rankIdNum = parseInt(currentRankId, 10);
    const wageTypeIdNum = parseInt(currentWageTypeId, 10);
    const amountNum = parseFloat(currentAmount);

    if (
      isNaN(rankIdNum) ||
      isNaN(wageTypeIdNum) ||
      isNaN(amountNum) ||
      amountNum <= 0
    ) {
      const validationMessage =
        "Invalid input. Please check rank, wage type, and amount (must be positive).";
      setError(validationMessage);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validationMessage,
      });
      return;
    }

    const payload: UpdateSalaryScalePayload = {
      wageRank: rankIdNum,
      wageType: wageTypeIdNum,
      wageAmount: amountNum,
    };

    setIsLoading(true);
    try {
      const response = await updateSalaryScale(
        salaryScale.SalaryScaleDetailID,
        payload
      );
      if (response.success) {
        toast({
          title: "Success!",
          description: response.message || "Salary scale updated successfully.",
          variant: "success", // Use the success variant from shadcn/ui
          // className: "bg-green-500 text-white", // Example for custom styling if needed via variant
        });
        onUpdateSuccess(response.data);
        onOpenChange(false);
      } else {
        const failureMessage =
          response.message || "Failed to update salary scale.";
        setError(failureMessage);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: failureMessage,
        });
      }
    } catch (error: unknown) {

      const err = error as Error
      console.error("Update error:", err);
      const errorMessage =
        err.message ||
        "An unexpected error occurred during update.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!salaryScale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 pt-2 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Edit Salary Scale for {salaryScale.Rank}
             {/* - {salaryScale.Wage} */}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="rank-edit" className="text-sm text-gray-600">
              Rank
            </Label>
            <Select
              value={currentRankId}
              onValueChange={setCurrentRankId}
              disabled={isLoading}>
              <SelectTrigger
                id="rank-edit"
                className="w-full border border-[#E0E0E0] rounded-md"
                disabled
                >
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent className="h-70">
                {ranks.map((rank) => (
                  <SelectItem key={rank.id} value={rank.id.toString()}>
                    {rank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wageType-edit" className="text-sm text-gray-600">
              Wage Type
            </Label>
            <Select
              value={currentWageTypeId}
              onValueChange={setCurrentWageTypeId}
              disabled={isLoading}>
              <SelectTrigger
                id="wageType-edit"
                disabled
                className="w-full border border-[#E0E0E0] rounded-md">
                <SelectValue placeholder="Select wage type" />
              </SelectTrigger>
              <SelectContent>
                {wageTypes.map((wageType) => (
                  <SelectItem key={wageType.id} value={wageType.id.toString()}>
                    {wageType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-edit" className="text-sm text-gray-600">
              Amount
            </Label>
            <Input
              id="amount-edit"
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="border border-[#E0E0E0] rounded-md"
              disabled={isLoading}
              min="0"
            />
          </div>
        </div>
        <DialogFooter className="flex !space-x-4 mt-8 pt-4 border-t">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="flex-1 text-sm h-11"
              disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
            onClick={handleSaveChanges}
            disabled={isLoading}>
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Update Salary Scale
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

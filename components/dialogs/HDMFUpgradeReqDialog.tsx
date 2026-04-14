import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  processApplication,
  ProcessApplicationResponse,
} from "@/src/services/application_crew/application.api";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface HDMFUpgradeReqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApplicationOperation: string;
  selectedApplicationStatus: string;
  requestData: {
    HDMFUpgradeRequestID: number;
    ApplicationRequestID: number;
    TargetID: number;
    HDMFAmount: number;
    DollarCurrency: number;
  };
  onSuccess?: () => void;
}

export function HDMFUpgradeReqDialog({
  open,
  onOpenChange,
  selectedApplicationOperation,
  selectedApplicationStatus,
  requestData,
  onSuccess,
}: HDMFUpgradeReqDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const handleClose = () => onOpenChange(false);

  const handleProcess = async (status: number) => {
    setIsSubmitting(true);
    try {
      const response: ProcessApplicationResponse = await processApplication(
        requestData.ApplicationRequestID,
        status
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `HDMF upgrade request ${
            status === 2 ? "approved" : "declined"
          } successfully`,
          variant: "default",
        });
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to process HDMF upgrade request",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error processing HDMF upgrade request:", error);
      toast({
        title: "Error",
        description:
          err.message ||
          "An error occurred while processing the HDMF upgrade request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-2 max-w-[600px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <div className="p-6 pb-8">
          <div className="flex items-center justify-center mb-8">
            <DialogTitle className="text-2xl font-bold  items-center text-primary">
              {selectedApplicationStatus !== "Pending"
                ? "HDMF View Request Details"
                : "HDMF Upgrade Request Details"}
            </DialogTitle>
          </div>

          <div className="space-y-6">
            <div className=" gap-x-6 gap-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="hdmfAmount"
                  className="block text-sm font-medium text-gray-500"
                >
                  HDMF Amount
                </label>
                <Input
                  id="hdmfAmount"
                  value={requestData.HDMFAmount}
                  className="w-full bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              {selectedApplicationStatus !== "Approved" &&
                selectedApplicationStatus !== "Declined" &&
                selectedApplicationOperation !== "HDMF Upgrade" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                      onClick={() => handleProcess(3)}
                      disabled={isSubmitting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Decline"}
                    </Button>

                    <Button
                      type="button"
                      className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                      onClick={() => handleProcess(2)}
                      disabled={
                        isSubmitting || selectedApplicationStatus === "Approved"
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Approve Request"}
                    </Button>
                  </>
                )}
              {selectedApplicationStatus !== "Pending" && (
                <Button
                  type="button"
                  className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90 p-5"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

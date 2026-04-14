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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Movement } from "../pages/crew/CrewMovement";
import {
  CrewRankItem,
  getCrewRankList,
  updateCrewMovement,
  UpdateCrewMovementPayload,
} from "@/src/services/crew/crew.api";
import { IVesselItem } from "../pages/JoinCrew";
import { getVesselList } from "@/src/services/vessel/vessel.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "../ui/use-toast";

const movementSchema = z.object({
  signOnDate: z.date().optional(),
  signOffDate: z.date().optional(),
  rankId: z.number().optional(),
  vesselId: z.number().optional(),
  vesselName: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface EditMovementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMovement: Movement | null;
  onSuccess: (newCrewMovement: Movement) => void;
  CrewCode: string;
}

export function EditMovementDialog({
  open,
  onOpenChange,
  selectedMovement,
  CrewCode,
  onSuccess,
}: EditMovementProps) {
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      signOnDate: undefined,
      signOffDate: undefined,
      rankId: undefined,
      vesselId: undefined,
    },
  });

  const { reset, formState } = form;
  const { isSubmitting } = formState;
  const [IsLoadingRank, setIsLoadingRank] = useState(false);
  const [rankList, setRankList] = useState<CrewRankItem[]>([]);
  const [selectedRank, setSelectedRank] = useState("");
  const [currentRank, setCurrentRank] = useState<string | null>(null);
  const [vesselList, setVesselList] = useState<IVesselItem[]>([]);
  const [selectedVessel, setSelectedVessel] = useState("");
  const [IsLoadingVessel, setIsLoadingVessel] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoadingRank(true);
      getCrewRankList()
        .then((response) => {
          if (response.success) {
            setRankList(response.data);
            const currentRank = response.data.find(
              (rank) => rank.RankName === selectedMovement?.Rank
            );
            if (currentRank) {
              setSelectedRank(currentRank.RankID.toString());
              setCurrentRank(currentRank.RankID.toString());
            }
          } else {
            console.error("Failed to fetch rank list:", response.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching rank list:", error);
        })
        .then(() => {
          setIsLoadingRank(false);
        });
    }
  }, [open, selectedMovement?.Rank]);

  useEffect(() => {
    if (open) {
      setIsLoadingVessel(true);
      getVesselList()
        .then((response) => {
          if (response.success) {
            setVesselList(response.data);
            // Pre-select current vessel if available
            if (selectedMovement?.VesselID) {
              setSelectedVessel(selectedMovement.VesselID.toString());
            }
          } else {
            console.error("Failed to fetch vessel list:", response.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching vessel list:", error);
        })
        .finally(() => {
          setIsLoadingVessel(false);
        });
    } else {
      setSelectedVessel("");
      setSelectedRank("");
    }
  }, [open, selectedMovement?.VesselID]);

  const vesselOptions = vesselList.map((vessel) => ({
    id: vessel.VesselID,
    value: vessel.VesselID.toString(),
    label: vessel.VesselName,
  }));

  const rankOptions = rankList
    .filter((rank) => rank.RankID.toString() !== currentRank)
    .map((rank) => ({
      id: rank.RankID,
      value: rank.RankID.toString(),
      label: rank.RankName,
    }));

  useEffect(() => {
    if (selectedMovement && open) {
      // find rank object based on RankName
      const currentRank = rankList.find(
        (r) => r.RankName.trim() === selectedMovement?.Rank.trim()
      );

      reset({
        signOnDate: selectedMovement.SignOnDate
          ? new Date(selectedMovement.SignOnDate)
          : undefined,
        signOffDate: selectedMovement.SignOffDate
          ? new Date(selectedMovement.SignOffDate)
          : undefined,
        rankId: currentRank ? currentRank.RankID : undefined,
        vesselId: selectedMovement.VesselID ?? undefined,
      });
    } else if (!open) {
      reset();
    }
  }, [selectedMovement, open, reset, rankList]);

  const onSubmit = async (data: MovementFormValues) => {
    if (!selectedMovement) {
      console.warn("No selectedMovement found!");
      return;
    }

    try {
      // Decide which date to send as movementDate
      const movementDate = data.signOffDate
        ? data.signOffDate.toISOString()
        : data.signOnDate
          ? data.signOnDate.toISOString()
          : "";

      const payload: UpdateCrewMovementPayload = {
        movementDate,
        rankId: data.rankId!,
        vesselId: data.vesselId!,
        vesselName:
          vesselList.find((v) => v.VesselID === data.vesselId)?.VesselName ??
          selectedMovement.Vessel,
      };

      const crewCode = CrewCode;
      const movementId = selectedMovement.MovementDetailID;

      const response = await updateCrewMovement(crewCode, movementId, payload);
      if (response?.success) {
        const updatedPayload = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        const updatedMovement: Movement = {
          ...selectedMovement,
          SignOnDate: updatedPayload.TransactionType === 1 ? movementDate : selectedMovement.SignOnDate,
          SignOffDate: updatedPayload.TransactionType === 2 ? movementDate : selectedMovement.SignOffDate,
          Rank: (() => {
            const matchedRank = rankList.find(r => r.RankID === updatedPayload.RankID);
            return matchedRank ? matchedRank.RankCode.trim() : selectedMovement.Rank;
          })(),
          VesselID: updatedPayload.vesselId ?? selectedMovement.VesselID,
          VesselName:
            vesselList.find((v) => v.VesselID === data.vesselId)?.VesselName ??
            selectedMovement.Vessel,
        };

        onSuccess(updatedMovement);

        toast({
          title: "Crew Movement Updated",
          description: "The crew movement has been successfully updated.",
          variant: "success",
        });

        onOpenChange(false);
        reset();
      } else {
        console.error("API returned failure:", response?.message);

        toast({
          title: "Error",
          description: response?.message || "Failed to edit crew movement",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Unexpected error during update:", err);

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
            Edit Movement
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sign On Date */}
            <FormField
              control={form.control}
              name="signOnDate"
              render={({ field }) => {
                const { value, onChange, onBlur, ref, name } = field;
                return (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-600">
                      Sign On Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSubmitting || selectedMovement?.TransactionType !== 1}
                        name={name}
                        ref={ref}
                        value={value ? value.toISOString().split("T")[0] : ""}
                        onChange={(e) =>
                          onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          )
                        }
                        onBlur={onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Sign Off Date */}
            <FormField
              control={form.control}
              name="signOffDate"
              render={({ field }) => {
                const { value, onChange, onBlur, ref, name } = field;
                return (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-600">
                      Sign Off Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        name={name}
                        ref={ref}
                        disabled={isSubmitting || selectedMovement?.TransactionType !== 2}
                        value={value ? value.toISOString().split("T")[0] : ""}
                        onChange={(e) =>
                          onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          )
                        }
                        onBlur={onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Rank Select */}
            <FormField
              control={form.control}
              name="rankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">Rank</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString() ?? ""}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rankOptions.map((rank) => (
                        <SelectItem key={rank.id} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Select */}
            <FormField
              control={form.control}
              name="vesselId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    Vessel
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString() ?? ""}
                    disabled={IsLoadingVessel}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full border border-[#E0E0E0] rounded-md">
                        <SelectValue placeholder="Select vessel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vesselOptions.map((vessel) => (
                        <SelectItem key={vessel.id} value={vessel.value}>
                          {vessel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  "Submitting..."
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
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

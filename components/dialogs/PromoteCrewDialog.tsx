"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Ship,
  MapPin,
  Check,
  ChevronDown,
  Loader2,
  User,
  Info,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { RiShieldStarLine } from "react-icons/ri";
import {
  CrewBasic,
  CrewRankItem,
  getCrewBasic,
  getCrewRankList,
} from "@/src/services/crew/crew.api";
import { getVesselList } from "@/src/services/vessel/vessel.api";
import { cn } from "@/lib/utils";
import { promoteCrew } from "@/src/services/vessel/vesselCrew.api";
import { toast } from "../ui/use-toast";
import Base64Image from "../Base64Image";
import Image from "next/image";
import { IVesselItem } from "../pages/JoinCrew";

interface PromoteCrewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewMember: {
    id: number;
    name: string;
    status: string;
    rank: string;
    crewCode: string;
    currentVessel?: string;
    vesselId?: number;
    signOnDate?: string;
  };
}

function SimpleSearchableSelect({
  options,
  placeholder,
  value,
  onChange,
  className,
  disabled = false,
}: {
  options: { id: string | number; value: string; label: string }[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchQuery, options]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    } else {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled} // prevent click
        className={cn(
          `w-full justify-between`,
          disabled
            ? "bg-gray-100 text-gray-800 cursor-not-allowed"
            : "bg-white",
          !value && "text-muted-foreground",
          className
        )}
        onClick={() => {
          if (!disabled) setOpen(!open); // don’t open dropdown if disabled
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center px-2 py-2 cursor-pointer hover:bg-accent",
                    value === option.value && "bg-accent"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PromoteCrewDialog({
  open,
  onOpenChange,
  crewMember,
}: PromoteCrewDialogProps) {
  const [crew, setCrew] = useState<CrewBasic | null>(null);
  const [vesselList, setVesselList] = useState<IVesselItem[]>([]);
  const [rankList, setRankList] = useState<CrewRankItem[]>([]);
  const [selectedVessel, setSelectedVessel] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [promotionDate, setPromotionDate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentRank, setCurrentRank] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getVesselList()
        .then((response) => {
          if (response.success) {
            setVesselList(response.data);
            // Pre-select current vessel if available
            if (crewMember.vesselId) {
              setSelectedVessel(crewMember.vesselId.toString());
            }
          } else {
            console.error("Failed to fetch vessel list:", response.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching vessel list:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSelectedVessel("");
      setSelectedRank("");
      setPromotionDate("");
      setSubmitted(false);
    }
  }, [open, crewMember.vesselId]);

  useEffect(() => {
    if (open) {
      getCrewBasic(crewMember.crewCode)
        .then((response) => {
          if (response.success) {
            setCrew(response.data);
          } else {
            console.error("Failed to fetch crew basic info:", response.message);
          }
        })
        .catch((error) => {
          console.error("Error fetching crew basic info:", error);
        });
    }
  }, [open, crewMember.crewCode]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getCrewRankList()
        .then((response) => {
          if (response.success) {
            setRankList(response.data);
            const currentRank = response.data.find(
              (rank) => rank.RankName === crewMember.rank
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
          setIsLoading(false);
        });
    }
  }, [open, crewMember.rank]);

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

  const handlePromote = () => {
    setSubmitted(true);
    if (!selectedVessel || !selectedRank || !promotionDate) {
      toast({
        title: "Missing Information",
        description: "Please select a vessel, rank, and promotion date.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRank === currentRank) {
      toast({
        title: "No Rank Change",
        description: "The selected rank is the same as the current rank.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const crewToBePromoted = {
      crewCode: crewMember.crewCode,
      vesselId: Number(selectedVessel),
      rankId: Number(selectedRank),
      promotionDate: new Date(promotionDate),
    };

    promoteCrew(
      crewToBePromoted.crewCode,
      crewToBePromoted.vesselId,
      crewToBePromoted.rankId,
      crewToBePromoted.promotionDate
    )
      .then((response) => {
        if (response.success) {
          toast({
            title: "Crew Promoted",
            description: `${
              crewMember.name
            } has been successfully promoted to ${
              rankOptions.find((r) => r.value === selectedRank)?.label
            } on vessel ${
              vesselOptions.find((v) => v.value === selectedVessel)?.label
            }.`,
            variant: "success",
          });
          onOpenChange(false); // Close dialog on success
          setSubmitted(false);
        } else {
          toast({
            title: "Promotion Failed",
            description:
              response.message || "An error occurred while promoting the crew.",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-2 max-w-[800px] gap-0 border rounded-lg overflow-hidden bg-[#FCFCFC]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-semibold text-primary text-center">
            Promote Crew
          </DialogTitle>
        </DialogHeader>

        <div className="flex p-6 pt-2 gap-6">
          {/* Left side - Crew Info Card */}
          <Card className="w-[300px] bg-[#FCFCFC] rounded-lg px-4 py-4 gap-2.5">
            <div className="w-40 h-40 mx-auto overflow-hidden rounded-lg border border-gray-200">
              {crew?.ProfileImage ? (
                <Base64Image
                  imageType={crew.ProfileImage.ContentType}
                  alt="Crew Profile Image"
                  base64String={crew.ProfileImage.FileContent}
                  width={160}
                  height={160}
                  className="object-contain w-full h-full"
                />
              ) : (
                <Image
                  width={256}
                  height={160}
                  src="/image.png"
                  alt="Selfie with ID Attachment"
                  className="object-cover w-full h-full"
                />
              )}
            </div>

            <h3 className="text-xl font-semibold text-center mb-0">
              {crewMember.name}
            </h3>

            <div className="flex items-center gap-1 justify-center">
              <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                On board
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Crew Code</div>
                  <div>{crewMember.crewCode}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RiShieldStarLine className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Rank</div>
                  <div>{crewMember.rank}</div>
                </div>
              </div>

              {/* <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Sign-on date</div>
                  <div>{crewMember.signOnDate || "N/A"}</div>
                </div>
              </div> */}
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Current Vessel</div>
                  <div>{crewMember.currentVessel || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Country</div>
                  <div>Japan</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Right side - Form Fields */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vessel</label>
              <SimpleSearchableSelect
                options={vesselOptions}
                placeholder="Select vessel"
                value={selectedVessel}
                //disabled={!!selectedVessel}
                onChange={setSelectedVessel}
                className="w-full"
              />
              {submitted && !selectedVessel && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <Info className="w-4 h-4" />
                  Please select a vessel.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Rank</label>
              <SimpleSearchableSelect
                options={rankOptions}
                placeholder="Select rank"
                value={selectedRank}
                onChange={setSelectedRank}
                className={`w-full ${
                  submitted && !selectedRank ? "border-red-500" : ""
                } ${
                  submitted && selectedRank === currentRank
                    ? "border-red-500"
                    : ""
                }`}
              />
              {submitted && selectedRank === currentRank && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <Info className="w-4 h-4" />
                  Please select a rank for promotion.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Promotion Date</label>
              <Input
                type="date"
                value={promotionDate}
                className={`w-full ${
                  submitted && !promotionDate ? "border-red-500" : ""
                }`}
                onChange={(e) => setPromotionDate(e.target.value)}
              />
              {submitted && !promotionDate && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <Info className="w-4 h-4" />
                  Please select a promotion date.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handlePromote}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              <>Promote Crew</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

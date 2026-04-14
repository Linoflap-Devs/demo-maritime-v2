"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { Ship } from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";
import { Card } from "@/components/ui/card";
import {
  DeductionItem,
  DeductionResponse,
  PhilhealthDeductionCrew,
  getPhilhealthDeductionList,
} from "@/src/services/deduction/governmentReports.api";
import generatePHRegister from "../PDFs/deductionsPHRegister";
import { format } from "date-fns";
import { capitalizeFirstLetter, formatCurrency, getMonthName } from "@/lib/utils";

export default function PhilhealthContribution() {
  const searchParams = useSearchParams();
  const vesselId = searchParams.get("vesselId");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [vesselInfo, setVesselInfo] =
    useState<DeductionItem<PhilhealthDeductionCrew> | null>(null);
  const [SSSDeductionData, setSSSDeductionData] = useState<
    PhilhealthDeductionCrew[]
  >([]);
  const [PHDeductionResponse, setPHDeductionResponse] = useState<DeductionResponse<PhilhealthDeductionCrew>>({} as DeductionResponse<PhilhealthDeductionCrew>);
  const [isLoading, setIsLoading] = useState(true);

  const yearParam = Number(searchParams.get("year")) || new Date().getFullYear();
  const monthParam =
    Number(searchParams.get("month")) || new Date().getMonth() + 1;

  const monthName = getMonthName(monthParam);

  useEffect(() => {
    const fetchPhilhealthDeductionData = async () => {
      if (!vesselId) return;

      const month =
        Number(searchParams.get("month")) || new Date().getMonth() + 1;
      const year = Number(searchParams.get("year")) || new Date().getFullYear();

      setIsLoading(true);
      try {
        const response = await getPhilhealthDeductionList(
          vesselId,
          month,
          year
        );

        if (response.success && Array.isArray(response.data)) {
          const vesselData = response.data[0];
          if (vesselData) {
            setVesselInfo(vesselData); // vessel-level info
            setSSSDeductionData(vesselData.Crew || []); // crew-level info
            setPHDeductionResponse(response)
          } else {
            setVesselInfo(null);
            setSSSDeductionData([]);
          }
        } else {
          console.error("Unexpected response format:", response);
          setVesselInfo(null);
          setSSSDeductionData([]);
        }
      } catch (error) {
        console.error("Error fetching Philhealth deduction data:", error);
        setVesselInfo(null);
        setSSSDeductionData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhilhealthDeductionData();
  }, [vesselId, searchParams]);

  const columns: ColumnDef<PhilhealthDeductionCrew>[] = [
    {
      accessorKey: "CrewName",
      header: () => <div className="text-left">Crew Name</div>,
      cell: ({ row }) => (
        <div className="font-medium text-left">{row.getValue("CrewName")}</div>
      ),
    },
    {
      accessorKey: "Rank",
      header: () => <div className="text-left">Rank</div>,
      cell: ({ row }) => <div className="text-left">{row.getValue("Rank")}</div>,
    },
    {
      accessorKey: "PHNumber",
      header: () => <div className="text-left">PH Number</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("PHNumber")}</div>
      ),
    },
    // {
    //   accessorKey: "Salary",
    //   header: () => <div className="text-left">Salary</div>,
    //   cell: ({ row }) => (
    //     <div className="text-right">{formatCurrency(row.getValue("Salary"), true)}</div>
    //   ),
    // },
    // {
    //   accessorKey: "Allotment",
    //   header: "Allotment",
    //   cell: ({ row }) => (
    //     <div className="text-right">
    //       {formatNumber(row.getValue("Allotment"))}
    //     </div>
    //   ),
    // },
    {
      accessorKey: "Gross",
      header: () => <div className="text-left">Gross</div>,
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("Gross"), true)}</div>
      ),
    },
    {
      accessorKey: "EE",
      header: () => <div className="text-left">EE</div>,
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("EE"), true)}</div>
      ),
    },
    {
      accessorKey: "ER",
      header: () => <div className="text-left">ER</div>,
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue("ER"), true)}</div>
      ),
    },
    // {
    //   accessorKey: "EEPremium",
    //   header: "EE Premium",
    //   cell: ({ row }) => (
    //     <div className="text-right">
    //       {formatNumber(row.getValue("EEPremium"))}
    //     </div>
    //   ),
    // },
    // {
    //   accessorKey: "EEPremiumRate",
    //   header: "EE Premium Rate (%)",
    //   cell: ({ row }) => (
    //     <div className="text-right">
    //       {formatNumber(row.getValue("EEPremiumRate"))}
    //     </div>
    //   ),
    // },
  ];

  // Filter the crew data based on search term
  const filteredData = SSSDeductionData.filter((item) =>
    item.CrewName?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

    const handlePrint = () => {
      if (!vesselInfo || !vesselInfo.Crew || vesselInfo.Crew.length === 0) {
        console.error("No allotment register data available");
        return;
      }
      
     const result = generatePHRegister(
       PHDeductionResponse,
       format(new Date(), "MMM dd, yyyy hh:mm aa").toString(),
       "vessel", // pass a string literal
     )  
    }

  //     const monthNames = [
  //       "JANUARY",
  //       "FEBRUARY",
  //       "MARCH",
  //       "APRIL",
  //       "MAY",
  //       "JUNE",
  //       "JULY",
  //       "AUGUST",
  //       "SEPTEMBER",
  //       "OCTOBER",
  //       "NOVEMBER",
  //       "DECEMBER",
  //     ];

  //     generateAllotmentPDF(
  //       [vesselInfo as unknown as SSSDeductionItem],
  //       monthNames[Number(month) - 1] ?? "ALL",
  //       year ? parseInt(year) : new Date().getFullYear(),
  //       Number(forexRate)
  //     );
  //   };

  return (
    <div className="h-full w-full p-6 pt-5 overflow-hidden">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .overflow-y-auto::-webkit-scrollbar,
        .overflow-auto::-webkit-scrollbar,
        .overflow-scroll::-webkit-scrollbar {
          display: none;
        }

        .overflow-y-auto,
        .overflow-auto,
        .overflow-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center gap-2">
          <Link href={ monthName && yearParam ? `/home/deduction/reports?month=${monthParam}&year=${yearParam}` : "/home/deduction/reports"}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold mb-0">{ monthName && yearParam ? `Philhealth Contribution- ${capitalizeFirstLetter(monthName)} ${yearParam}` : "Philhealth Contribution"}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-6 bg-[#F5F6F7]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-xl text-gray-500 uppercase">
                {vesselInfo?.VesselCode}
              </div>
              <h2 className="text-2xl font-semibold">
                {vesselInfo?.VesselName}
              </h2>
              <Badge
                variant="secondary"
                className="mt-2 px-6 py-0 bg-[#DFEFFE] text-primary"
              >
                Active
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-lg flex items-center gap-2">
                <Ship className="h-4 w-4" />
                {vesselInfo?.VesselType || "N/A"}
              </div>
              <Card className="p-1 bg-[#FDFDFD] mt-2">
                <div className="text-sm text-center">
                  <p className="flex items-center justify-center font-semibold">
                    {vesselInfo?.Principal || "N/A"}
                  </p>
                  <div className="text-gray-500 text-xs flex items-center justify-center">
                    Principal Name
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center gap-4 mt-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search Crew...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-[#EAEBF9]"
            />
          </div>
          <div className="flex gap-4">
            <Button
              className="gap-2 h-11 px-5"
              disabled={isLoading}
              onClick={handlePrint}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <AiOutlinePrinter className="h-4 w-4" />
                  Print Report
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md border pb-3">
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>Loading Philhealth deduction data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <DataTable columns={columns} data={filteredData} pageSize={6} />
          ) : (
            <div className="flex justify-center items-center p-10">
              <p>No Philhealth data available for this vessel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

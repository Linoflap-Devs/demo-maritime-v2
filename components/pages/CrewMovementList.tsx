"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ChevronLeft,
  ArrowDownUp,
  Filter,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getVesselCrew,
  VesselCrewResponse,
} from "@/src/services/vessel/vessel.api";
import { useRouter, useSearchParams } from "next/navigation";
import { RepatriateCrewDialog } from "../dialogs/RepatriateCrewDialog";
import { Checkbox } from "../ui/checkbox";
import { TbShipOff } from "react-icons/tb";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useDebounce } from "@/lib/useDebounce";
import { getCrewList } from "@/src/services/crew/crew.api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useJoinCrewStore } from "@/src/store/useJoinCrewStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MdOutlineBadge } from "react-icons/md";
import { PromoteCrewDialog } from "../dialogs/PromoteCrewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "../ui/dialog";

interface ISelectedCrew {
  id: number;
  name: string;
  status: string;
  rank: string;
  crewCode: string;
  currentVessel?: string;
  vesselId?: number;
  rankId: number;
}

export interface IOffBoardCrew {
  CrewID: any;
  CrewCode: string;
  LastName: string;
  FirstName: string;
  MiddleName: string;
  RankID: number;
  Rank: string;
  CrewStatusID: number;
  AccountValidation: number | null;
  IsActive: number;
}

export default function CrewMovementList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vesselId = searchParams.get("id");
  const vesselName = searchParams.get("vesselName");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("promote-crew");
  const [vesselData, setVesselData] = useState<VesselCrewResponse | null>(null);
  const [onSuccess, setOnSuccess] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<ISelectedCrew[]>([]);
  const [repatriateDialogOpen, setRepatriateDialogOpen] = useState(false);
  const [isLoadingRepatriate, setIsLoadingRepatriate] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [displayedCrews, setDisplayedCrews] = useState<IOffBoardCrew[]>([]);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [allCrews, setAllCrews] = useState<IOffBoardCrew[]>([]);
  const [rankFilter, setRankFilter] = useState("all");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [totalCrews, setTotalCrews] = useState<number>(0);
  const [modalOpenJoin, setModalOpenJoin] = useState(false);
  const [modalOpenRepatriate, setModalOpenRepatriate] = useState(false);

  useEffect(() => {
    const fetchVesselCrew = async () => {
      if (!vesselId) return;
      setIsLoadingRepatriate(true);
      try {
        const response = await getVesselCrew(vesselId);
        setVesselData(response);
      } catch (error) {
        console.error("Error fetching vessel crew:", error);
      } finally {
        setIsLoadingRepatriate(false);
      }
    };

    fetchVesselCrew();
  }, [vesselId, onSuccess]);

  useEffect(() => {
    setIsLoadingJoin(true);

    getCrewList()
      .then((response) => {
        if (response.success) {
          // Total count of all crews before filtering
          const totalCrewCount = response.data.length;

          const offBoardCrews: IOffBoardCrew[] = response.data
            .filter((crew) => crew.CrewStatusID === 2 && crew.IsActive === 1)
            .map((crew) => ({
              CrewID: crew.CrewID,
              CrewCode: crew.CrewCode,
              LastName: crew.LastName,
              FirstName: crew.FirstName,
              MiddleName: crew.MiddleName ?? "",
              RankID: crew.RankID,
              Rank: crew.Rank,
              CrewStatusID: crew.CrewStatusID,
              AccountValidation: crew.AccountValidation ?? null,
              IsActive: crew.IsActive,
            }));

          setAllCrews(offBoardCrews);
          setDisplayedCrews(offBoardCrews);

          // Store or log total crew count
          setTotalCrews(totalCrewCount);
        } else {
          console.error("Failed to fetch crew list:", response.message);
        }

        setIsLoadingJoin(false);
      })
      .catch((error) => {
        console.error("Error fetching crew list:", error);
        setIsLoadingJoin(false);
      });
  }, []);

  const selectedCrews = allCrews.filter((crew) => selectedRowIds[crew.CrewCode]);

  useEffect(() => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const filtered = allCrews.filter(
        (crew) =>
          crew.FirstName.toLowerCase().includes(searchLower) ||
          crew.LastName.toLowerCase().includes(searchLower) ||
          crew.CrewCode.toLowerCase().includes(searchLower)
      );
      setDisplayedCrews(filtered.slice(0, 50));
    } else {
      setDisplayedCrews(allCrews.slice(0, 50));
    }
  }, [debouncedSearch, allCrews]);


  const crewData = useMemo(
    () =>
      vesselData?.data.Crew.map((crew, index) => ({
        id: crew.CrewID,
        name: `${crew.FirstName} ${crew.MiddleName ? crew.MiddleName + " " : ""
          }${crew.LastName}`,
        status: crew.Status === 1 ? "On board" : "Inactive",
        signOnDate: crew.SignOnDate,
        rank: crew.Rank,
        rankId: crew.RankID,
        crewCode: crew.CrewCode,
        country: crew.Country,
      })) || [],
    [vesselData]
  );

  const selectedRows = crewData.filter((row) => selectedRowIds[row.crewCode]);
  const allCrewCodes = useMemo(() => allCrews.map(c => c.CrewCode), [allCrews]);

  const filteredCrewData = useMemo(() => {
    return crewData.filter((crew) => {

      const matchesSearch = searchTerm
        ? `${crew.name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crew.crewCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crew.rank.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesRank = rankFilter && rankFilter !== "all"
        ? crew.rank.toLowerCase() === rankFilter.toLowerCase()
        : true;

      return matchesSearch && matchesRank;
    });
  }, [crewData, searchTerm, rankFilter]);

  const filteredJoinCrewData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();

    return allCrews.filter((crew) => {
      const firstName = (crew.FirstName ?? '').trim().toLowerCase();
      const middleName = (crew.MiddleName ?? '').trim().toLowerCase();
      const lastName = (crew.LastName ?? '').trim().toLowerCase();

      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const matchesName = fullName.includes(searchLower);
      const matchesCodeOrRank = crew.CrewCode?.toLowerCase().includes(searchLower) ||
        crew.Rank?.toLowerCase().includes(searchLower);

      const matchesSearch = searchLower ? matchesName || matchesCodeOrRank : true;
      const matchesRank = rankFilter && rankFilter !== "all"
        ? crew.Rank?.toLowerCase() === rankFilter.toLowerCase()
        : true;

      return matchesSearch && matchesRank;
    });
  }, [allCrews, searchTerm, rankFilter]);

  const columnJoin: ColumnDef<IOffBoardCrew>[] = [
    {
      id: "select",
      header: ({ table }) => {
        // Get crew codes of rows visible on the current page
        const visibleCrewCodes = table.getRowModel().rows.map(row => row.original.CrewCode);

        // Check if all visible rows are selected globally
        const allSelected = visibleCrewCodes.length > 0 && visibleCrewCodes.every(code => selectedRowIds[code]);
        const someSelected = visibleCrewCodes.some(code => selectedRowIds[code]);

        return (
          <Checkbox
            className="border-gray-500 text-gray-900 dark:border-gray-400 dark:text-white"
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              setSelectedRowIds((prev) => {
                const updated = { ...prev };
                visibleCrewCodes.forEach(code => {
                  updated[code] = !!checked;
                });
                return updated;
              });
            }}
            aria-label="Select all visible crews"
          />
        );
      },
      cell: ({ row }) => {
        const crewCode = row.original.CrewCode;
        const isSelected = !!selectedRowIds[crewCode];
        return (
          <Checkbox
            className="border-gray-400 text-gray-700 dark:border-gray-400 dark:text-white"
            checked={isSelected}
            onCheckedChange={(checked) => {
              setSelectedRowIds((prev) => ({
                ...prev,
                [crewCode]: !!checked,
              }));
            }}
            aria-label={`Select crew ${crewCode}`}
          />
        );
      },
    },
    {
      accessorKey: "CrewCode",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Crew Code</p>

          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("CrewCode")}</div>
      ),
    },
    {
      id: "Crew Name",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Crew Name</p>
          <ArrowDownUp size={15} />
        </div>
      ),
      accessorFn: (row) => `${row.LastName} ${row.MiddleName} ${row.FirstName}`, // for sorting
      cell: ({ row }) => {
        const lastName = row.original.LastName;
        const firstName = row.original.FirstName;
        const middleName = row.original.MiddleName

        return <div className="text-left">{`${firstName} ${middleName} ${lastName}`}</div>;
      },
    },
    {
      accessorKey: "Rank",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Rank</p>
          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Rank")}</div>
      ),
    },
    {
      accessorKey: "CrewStatusID",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("CrewStatusID");
        return (
          <div>
            <span
              className={`${status === 2
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
                } px-2 py-0.5 rounded-full text-xs`}>
              {status === 2 ? "Off board" : "On board"}
            </span>
          </div>
        );
      },
    },
  ];

  const columRepatriate: ColumnDef<(typeof crewData)[number]>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const visibleCrewCodes = table.getRowModel().rows.map(row => row.original.crewCode);

        const allSelected = visibleCrewCodes.length > 0 && visibleCrewCodes.every(code => selectedRowIds[code]);
        const someSelected = visibleCrewCodes.some(code => selectedRowIds[code]);

        return (
          <Checkbox
            className="border-gray-500 text-gray-900 dark:border-gray-400 dark:text-white"
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              setSelectedRowIds((prev) => {
                const updated = { ...prev };
                visibleCrewCodes.forEach(code => {
                  updated[code] = !!checked;
                });
                return updated;
              });
            }}
            aria-label="Select all visible crews"
          />
        );
      },
      cell: ({ row }) => {
        const crewCode = row.original.crewCode;
        const isSelected = !!selectedRowIds[crewCode];
        return (
          <Checkbox
            className="border-gray-400 text-gray-700 dark:border-gray-400 dark:text-white"
            checked={isSelected}
            onCheckedChange={(checked) => {
              setSelectedRowIds((prev) => ({
                ...prev,
                [crewCode]: !!checked,
              }));
            }}
            aria-label={`Select crew ${crewCode}`}
          />
        );
      },
    },
    {
      accessorKey: "crewCode",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Crew Code</p>

          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("crewCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Crew Name</p>

          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex">
            {name.toUpperCase()}
          </div>
        );
      },
    },
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Rank</p>
          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("rank")}</div>
      ),
    },
    {
      accessorKey: "signOnDate",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Sign On Date</p>
          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => {
        const rawDate = row.getValue("signOnDate") as string | Date | null;
        const formattedDate = rawDate
          ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(new Date(rawDate))
          : "-";

        return <div className="text-center">{formattedDate}</div>;
      }
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={`${status === "On board"
                ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                : "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
                }`}>
              {status}
            </Badge>
          </div>
        );
      },
    },
  ];

  const columnPromote: ColumnDef<(typeof crewData)[number]>[] = [
    {
      accessorKey: "crewCode",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Crew Code</p>

          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("crewCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (

        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Crew Name</p>

          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex">
            {name.toUpperCase()}
          </div>
        );
      },
    },
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center cursor-pointer text-left space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <p>Rank</p>
          <ArrowDownUp size={15} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("rank")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={`${status === "On board"
                ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                : "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
                }`}>
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const crew = row.original;
        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const selected = crew;

                    setSelectedCrew([
                      {
                        ...selected,
                        currentVessel: vesselName || "",
                        vesselId: vesselId ? Number(vesselId) : 0,
                      },
                    ]);
                    setPromoteDialogOpen(true);
                  }}
                >
                  <MdOutlineBadge className="mr-2" />
                  For Promotion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const handleRepatriate = () => {
    if (selectedRows.length === 0) {
      console.warn("No rows selected for repatriation.");
      return;
    }

    const enrichedSelectedRows = selectedRows.map((crew) => ({
      ...crew,
      currentVessel: vesselName || "",
      vesselId: vesselId ? Number(vesselId) : 0,
    }));

    setSelectedCrew(enrichedSelectedRows);
    setRepatriateDialogOpen(true);
  };

  const handleModalOpenJoin = () => {
    setModalOpenJoin((prev) => !prev);
  };

  const handleModalOpenRepatriate = () => {
    setModalOpenRepatriate((prev) => !prev);
  };

  const handleJoin = () => {
    if (!selectedCrews || selectedCrews.length === 0) {
      console.warn("No crews selected.");
      return;
    }
    const selectedVesselName = vesselName;
    const selectedVesselId = vesselId;

    const mappedSelectedCrew: ISelectedCrew[] = selectedCrews.map((crew, idx) => ({
      id: crew.CrewID,
      name: `${crew.FirstName} ${crew.MiddleName ? crew.MiddleName + " " : ""}${crew.LastName}`,
      status: "Off board",
      rank: crew.Rank,
      rankId: crew.RankID,
      crewCode: crew.CrewCode,
      vesselId: selectedVesselId ? Number(selectedVesselId) : undefined,
      selectedVesselName: selectedVesselName,
    }));

    useJoinCrewStore.getState().setSelectedCrew(mappedSelectedCrew);
    router.push("/home/crew-movement/join-crew");
  };

  return (
    <div className="h-full w-full p-3 pt-3 overflow-hidden">
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        /* Hide scrollbar for all scrollable elements in the component */
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
      <div className="h-full overflow-hidden">
        <div className="pt-3 pb-1 sm:p-4 flex flex-col space-y-4 sm:space-y-5 h-full">
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Link href="/home/crew-movement">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-semibold mb-0">Vessel {vesselName}</h1>
            </div>
          </div>

          <Card className="h-[calc(100vh-180px)] flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(tabValue) => {
              setActiveTab(tabValue);
              setSearchTerm("");
              setRankFilter("all");
            }}>
              <div className="border-b">
                <div className="px-4 pt-1">
                  <TabsList className="bg-transparent p-0 h-8 w-full flex justify-start space-x-8">
                    <TabsTrigger
                      value="promote-crew"
                      className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                    >
                      Promote Crew
                    </TabsTrigger>
                    <TabsTrigger
                      value="join-crew"
                      className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                    >
                      Join Crews
                    </TabsTrigger>
                    <TabsTrigger
                      value="repatriate-crew"
                      className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                    >
                      Repatriate Crews
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent
                value="join-crew"
                className="p-2 mt-0 overflow-y-auto flex-1"
              >
                <div className="p-3 sm:p-4 flex flex-col space-y-4 sm:space-y-5 min-h-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                    <div className="relative w-full md:flex-1">
                      <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-4 sm:h-4.5 w-4 sm:w-4.5 text-muted-foreground" />
                      <Input
                        placeholder="Search Crew name or Crew Code....."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-[#EAEBF9]"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <Select
                        value={rankFilter}
                        onValueChange={setRankFilter}
                      >
                        <SelectTrigger className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-2 min-w-[160px] sm:min-w-[170px] w-full sm:w-auto">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="All Ranks" />
                        </SelectTrigger>

                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="all">All Ranks</SelectItem>
                          {[...new Set(allCrews.map((item) => item.Rank).filter(Boolean))].map(
                            (rank) => (
                              <SelectItem key={rank} value={rank}>
                                {rank}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Button
                              className="gap-2 h-11 px-5"
                              onClick={handleModalOpenJoin}
                              disabled={selectedCrews.length === 0}
                            >
                              <Plus />
                              Join Crew(s)
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {selectedCrews.length === 0 && (
                          <TooltipContent className="text-sm">
                            Select Crew(s) to join.
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-y-auto pb-3">
                    {isLoadingJoin ? (
                      <div className="flex justify-center items-center h-40">
                        <p className="text-muted-foreground">Loading crew data...</p>
                      </div>
                    ) : (
                      <DataTable
                        columns={columnJoin}
                        data={filteredJoinCrewData}
                        pageSize={7}
                        rowSelection={selectedRowIds}
                        onRowSelectionChange={setSelectedRowIds}
                        selectedRowIds={selectedRowIds}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="repatriate-crew"
                className="p-2 mt-0 overflow-y-auto flex-1"
              >
                <div className="p-3 sm:p-4 flex flex-col space-y-4 sm:space-y-5 min-h-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                    <div className="relative w-full md:flex-1">
                      <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-4 sm:h-4.5 w-4 sm:w-4.5 text-muted-foreground" />
                      <Input
                        placeholder="Search crew by name, code, or rank..."
                        className="bg-[#EAEBF9] pl-8 sm:pl-9 py-4 sm:py-5 text-xs sm:text-sm h-9 sm:h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <Select
                        value={rankFilter}
                        onValueChange={setRankFilter}
                      >
                        <SelectTrigger className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-2 min-w-[160px] sm:min-w-[170px] w-full sm:w-auto">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="All Ranks" />
                        </SelectTrigger>

                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="all">All Ranks</SelectItem>
                          {[...new Set(crewData.map((item) => item.rank).filter(Boolean))].map(
                            (rank) => (
                              <SelectItem key={rank} value={rank}>
                                {rank}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Button
                              className="gap-2 h-11 px-5"
                              onClick={handleModalOpenRepatriate}
                              disabled={selectedRows.length === 0}
                            >
                              <TbShipOff />
                              Repatriate Crews
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {selectedRows.length === 0 && (
                          <TooltipContent className="text-sm">
                            Select Crew(s) to repatriate.
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                  </div>
                  {isLoadingRepatriate ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Loading crew data...</p>
                    </div>
                  ) : (
                    <div className="bg-[#F9F9F9] rounded-md border pb-3">
                      <DataTable
                        columns={columRepatriate}
                        data={filteredCrewData}
                        pageSize={7}
                        rowSelection={selectedRowIds}
                        onRowSelectionChange={setSelectedRowIds}
                        selectedRowIds={selectedRowIds}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="promote-crew"
                className="p-2 mt-0 overflow-y-auto flex-1"
              >
                <div className="p-3 sm:p-4 flex flex-col space-y-4 sm:space-y-5 min-h-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                    <div className="relative w-full md:flex-1">
                      <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-4 sm:h-4.5 w-4 sm:w-4.5 text-muted-foreground" />
                      <Input
                        placeholder="Search crew by name, code, or rank..."
                        className="bg-[#EAEBF9] pl-8 sm:pl-9 py-4 sm:py-5 text-xs sm:text-sm h-9 sm:h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <Select
                        value={rankFilter}
                        onValueChange={setRankFilter}
                      >
                        <SelectTrigger className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-2 min-w-[160px] sm:min-w-[170px] w-full sm:w-auto">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="All Ranks" />
                        </SelectTrigger>

                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="all">All Ranks</SelectItem>
                          {[...new Set(crewData.map((item) => item.rank).filter(Boolean))].map(
                            (rank) => (
                              <SelectItem key={rank} value={rank}>
                                {rank}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  {isLoadingRepatriate ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Loading crew data...</p>
                    </div>
                  ) : (
                    <div className="bg-[#F9F9F9] rounded-md border pb-3">
                      <DataTable
                        columns={columnPromote}
                        data={filteredCrewData}
                        pageSize={7}
                        rowSelection={selectedRowIds}
                        onRowSelectionChange={(selection) => {
                          if (activeTab === "promote-crew") {
                            // Only allow selecting one crew at a time
                            const selectedKeys = Object.keys(selection).filter((key) => selection[key]);
                            const limitedSelection = selectedKeys.length > 0
                              ? { [selectedKeys[selectedKeys.length - 1]]: true }
                              : {};
                            setSelectedRowIds(limitedSelection);
                          } else {
                            setSelectedRowIds(selection);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <PromoteCrewDialog
        open={promoteDialogOpen}
        onOpenChange={setPromoteDialogOpen}
        crewMember={
          selectedCrew && selectedCrew.length > 0
            ? {
              ...selectedCrew[0],
              currentVessel: vesselName || "",
              vesselId: vesselId ? Number(vesselId) : 0,
            }
            : {
              id: 0,
              name: "",
              status: "",
              rank: "",
              crewCode: "",
              currentVessel: "",
              vesselId: 0,
            }
        }
      />

      <RepatriateCrewDialog
        open={repatriateDialogOpen}
        onOpenChange={setRepatriateDialogOpen}
        setOnSuccess={setOnSuccess}
        crewMembers={selectedCrew as {
          id: number;
          name: string;
          status: string;
          rank: string;
          crewCode: string;
          currentVessel?: string;
          country?: string;
          vesselId: number;
          signOnDate?: Date;
        }[]}
        setModalOpenRepatriate={setModalOpenRepatriate}
      />

      {modalOpenJoin && (
        <Dialog open={modalOpenJoin} onOpenChange={setModalOpenJoin}>
          <DialogContent className="sm:max-w-[650px] bg-[#FCFCFC] p-10">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-center text-2xl font-semibold text-primary">
                Confirm Join List
              </DialogTitle>
            </DialogHeader>

            {selectedCrews?.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {selectedCrews.map((crew, index) => (
                  <div key={index} className="px-4 py-2 bg-primary text-white rounded-full font-medium text-sm">
                    {index + 1}. {crew.FirstName} {crew.LastName}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No crews selected</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpenJoin(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleJoin}
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
              >
                {(isLoadingJoin && isLoadingRepatriate) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    Join Crews
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {modalOpenRepatriate && (
        <Dialog open={modalOpenRepatriate} onOpenChange={setModalOpenRepatriate}>
          <DialogContent className="sm:max-w-[650px] bg-[#FCFCFC] p-10">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-center text-2xl font-semibold text-primary">
                Confirm Repatriate List
              </DialogTitle>
            </DialogHeader>

            {selectedRows?.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {selectedRows.map((crew, index) => (
                  <div key={index} className="px-4 py-2 bg-primary text-white rounded-full font-medium text-sm">
                    {index + 1}. {crew.name.toUpperCase()}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No crews selected</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpenRepatriate(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRepatriate}
                className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
              >
                {(isLoadingJoin && isLoadingRepatriate) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    Repatriate Crews
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

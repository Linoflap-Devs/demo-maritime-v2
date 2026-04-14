"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Swal from "sweetalert2";
import { getApplications } from "@/src/services/application_crew/application.api";
import { AddAllotteeReqDialog } from "@/components/dialogs/AddAllotteeReqDialog";
import { DeleteAllotteeReqDialog } from "@/components/dialogs/DeleteAllotteeReqDialog";
import { HDMFUpgradeReqDialog } from "@/components/dialogs/HDMFUpgradeReqDialog";
import { PiUserListFill } from "react-icons/pi";
import { format } from "date-fns";

interface AllotteeRequestData {
  AllotteeRequestID: number;
  ApplicationRequestID: number;
  TargetID: number | null;
  AllotteeName: string;
  RelationID: number;
  Relation: string;
  ContactNumber: string;
  Address: string;
  CityID: number;
  City: string;
  ProvinceID: number;
  Province: string;
  BankID: number;
  Bank: string;
  BankBranchID: number;
  BankBranch: string;
  AccountNumber: string;
  Allotment: number;
  Payslip: number;
  AllotmentType: number;
}

interface HDMFUpgradeRequestData {
  HDMFUpgradeRequestID: number;
  ApplicationRequestID: number;
  TargetID: number;
  HDMFAmount: number;
  DollarCurrency: number;
}

interface Application {
  ApplicationRequestID: number;
  CrewCode: string;
  CreatedAt: Date;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Rank: string;
  ProcessedAt: Date;
  ApplicationStatus: string;
  ApplicationType: string;
  ApplicationOperation: string;
  RequestData: AllotteeRequestData | HDMFUpgradeRequestData;
}

export default function CrewApplication() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isClose, setClose] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true); ``
      const response = await getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch applications",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailsDialog(true);
  };

  const baseColumns: ColumnDef<Application>[] = [
    {
      accessorKey: "CrewCode",
      header: "Crew Code",
    },
    {
      id: "fullName",
      header: "Crew Name",
      accessorFn: (row) => {
        const middleInitial = row.MiddleName
          ? ` ${row.MiddleName.charAt(0)}. `
          : " ";
        return `${row.FirstName}${middleInitial}${row.LastName}`;
      },
    },
    {
      accessorKey: "Rank",
      header: "Rank",
    },
    {
      accessorKey: "ApplicationStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.ApplicationStatus.toLowerCase();

        const statusClasses = {
          pending: "bg-[#F5ECE4] text-[#9F6932]",
          approved: "bg-green-100 text-green-600",
          declined: "bg-red-100 text-red-600",
        };

        return (
          <Badge
            className={cn(
              "font-medium",
              statusClasses[status as keyof typeof statusClasses]
            )}
          >
            {row.original.ApplicationStatus}
          </Badge>
        );
      },
    },
    {
      accessorKey: "ApplicationType",
      header: "Application Type",
    },
    {
      accessorKey: "ApplicationOperation",
      header: "Application Operation",
    },
    {
      accessorKey: "CreatedAt",
      header: "Date Requested",
      cell: ({ row }) => {
        const date = format(new Date(row.original.CreatedAt), "MMM dd, yyyy | hh:mm aa");
        return <span>{date}</span>
      }
    },
    {
      accessorKey: "ProcessedAt",
      header: "Date Processed",
      enableHiding: true,
      cell: ({ row }) => {
        let value = row.original.ProcessedAt ? format(new Date(row.original.ProcessedAt), "MMM dd, yyyy | hh:mm aa") : "-"
        return <span>{value}</span>
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <PiUserListFill className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
              View Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const columns: ColumnDef<Application>[] =
    activeTab === "declined"
      ? baseColumns.filter((col) => col.id !== "actions")
      : baseColumns;

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = activeTab === app.ApplicationStatus.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      app.CrewCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.Rank.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesApplicationType =
      applicationTypeFilter === "all" ||
      app.ApplicationType.toLowerCase() === applicationTypeFilter;

    return matchesStatus && matchesSearch && matchesApplicationType;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setApplicationTypeFilter("all");
  };

  return (
    <>
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
          <div className="p-3 pt-0 sm:p-4 flex flex-col space-y-4 sm:space-y-5 h-full">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-semibold mb-0">Applications</h1>
            </div>

            <Card className="h-[calc(100vh-180px)] flex flex-col overflow-hidden">
              <Tabs
                defaultValue={activeTab}
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full flex flex-col h-full"
              >
                <div className="border-b">
                  <div className="px-4 pt-1">
                    <TabsList className="bg-transparent p-0 h-8 w-full flex justify-start space-x-8">
                      <TabsTrigger
                        value="pending"
                        className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                      >
                        Pending
                      </TabsTrigger>
                      <TabsTrigger
                        value="approved"
                        className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                      >
                        Approved
                      </TabsTrigger>
                      <TabsTrigger
                        value="declined"
                        className="px-10 pb-8 h-full text-lg data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none cursor-pointer"
                      >
                        Declined
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {["pending", "approved", "declined"].map((tabValue) => (
                  <TabsContent
                    key={tabValue}
                    value={tabValue}
                    className="p-2 mt-0 overflow-y-auto flex-1"
                  >
                    <div className="p-3 sm:p-4 flex flex-col space-y-4 sm:space-y-5 min-h-full">
                      {/* Search and Filters */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                        <div className="relative w-full md:flex-1">
                          <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-4 sm:h-4.5 w-4 sm:w-4.5 text-muted-foreground" />
                          <Input
                            placeholder="Search applications..."
                            className="bg-[#EAEBF9] pl-8 sm:pl-9 py-4 sm:py-5 text-xs sm:text-sm h-9 sm:h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                          <Select
                            onValueChange={(value) =>
                              setApplicationTypeFilter(value)
                            }
                          >
                            <SelectTrigger className="w-full h-full sm:w-60 sm:h-20">
                              <SelectValue placeholder="Filter by Application Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="allottee">Allottee</SelectItem>
                              <SelectItem value="hdmf upgrade">
                                HDMF Upgrade
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* DataTable */}
                      <div className="bg-[#F9F9F9] rounded-md border mb-3">
                        {loading ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        ) : (
                          <DataTable
                            columns={baseColumns}
                            data={filteredApplications}
                            pageSize={7}
                          />
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {selectedApplication?.ApplicationType === "Allottee" && (
        <>
          {selectedApplication.ApplicationStatus !== "Declined" && (
            <AddAllotteeReqDialog
              open={showDetailsDialog}
              onOpenChange={setShowDetailsDialog}
              selectedApplicationStatus={selectedApplication.ApplicationStatus}
              requestData={
                selectedApplication.RequestData as AllotteeRequestData
              }
              onSuccess={fetchApplications}
            />
          )}

          {selectedApplication.ApplicationStatus === "Declined" && (
            <DeleteAllotteeReqDialog
              open={showDetailsDialog}
              onOpenChange={setShowDetailsDialog}
              requestData={
                selectedApplication.RequestData as AllotteeRequestData
              }
              onSuccess={fetchApplications}
            />
          )}
        </>
      )}

      {selectedApplication?.ApplicationType === "HDMF Upgrade" && (
        <HDMFUpgradeReqDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          selectedApplicationOperation={
            selectedApplication.ApplicationOperation
          }
          selectedApplicationStatus={selectedApplication.ApplicationStatus}
          requestData={
            selectedApplication.RequestData as HDMFUpgradeRequestData
          }
          onSuccess={fetchApplications}
        />
      )}
    </>
  );
}

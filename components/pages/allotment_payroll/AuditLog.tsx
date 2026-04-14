
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Calendar,
  User,
  Activity,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getAuditLogs,
  AuditLogEntry,
  AuditLogFilters,
} from "@/src/services/audit/audit.api";

const ITEMS_PER_PAGE = 10;

function getActionIcon(action: string, size = "h-8 w-8") {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("create") || actionLower.includes("add")) {
    return <Plus className={`${size} text-white`} />;
  } else if (actionLower.includes("update") || actionLower.includes("edit")) {
    return <Edit className={`${size} text-white`} />;
  } else if (actionLower.includes("delete") || actionLower.includes("remove")) {
    return <Trash2 className={`${size} text-white`} />;
  }
  return <Activity className={`${size} text-white`} />;
}

function getActionCircleColor(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("create") || actionLower.includes("add")) {
    return "bg-blue-500";
  } else if (actionLower.includes("update") || actionLower.includes("edit")) {
    return "bg-yellow-500";
  } else if (actionLower.includes("delete") || actionLower.includes("remove")) {
    return "bg-red-500";
  }
  return "bg-gray-500";
}

function formatTableName(tableName: string): string {
  if (!tableName) return "record";

  const lowerName = tableName.toLowerCase();

  const tableNameMappings: { [key: string]: string } = {
    remittanceheader: "Remittance",
    remittancedetail: "Remittance",
    crewbasic: "Crew",
    crewmember: "Crew Member",
    vesselprofile: "Vessel",
    allottee: "Allottee",
    users: "User",
    auditlog: "Audit Log",
    payrollheader: "Payroll",
    payrolldetail: "Payroll",
  };

  if (tableNameMappings[lowerName]) {
    return tableNameMappings[lowerName];
  }

  let cleanName = lowerName
    .replace(/header$/, "")
    .replace(/detail$/, "")
    .replace(/s$/, "");

  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
}

export default function AuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    auditLogs,
    selectedUser,
    selectedAction,
    selectedModule,
    dateFrom,
    dateTo,
  ]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAuditLogs({});
      if (response.success) {
        const sortedLogs = response.data.sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        );
        setAuditLogs(sortedLogs);
      } else {
        setError(response.message || "Failed to load audit logs");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to load audit logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (selectedUser !== "all") {
      filtered = filtered.filter((log) => log.UserName === selectedUser);
    }

    if (selectedAction !== "all") {
      filtered = filtered.filter(
        (log) => log.ActionType.toLowerCase() === selectedAction.toLowerCase()
      );
    }

    if (selectedModule !== "all") {
      filtered = filtered.filter((log) => log.ModuleName === selectedModule);
    }

    if (dateFrom) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.CreatedAt);
        return logDate >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.CreatedAt);
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        return logDate <= endOfDay;
      });
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedUser("all");
    setSelectedAction("all");
    setSelectedModule("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const groupedLogs = currentLogs.reduce((groups, log) => {
    const date = new Date(log.CreatedAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, AuditLogEntry[]>);

  const createDescription = (log: AuditLogEntry): string => {
    const user = log.UserName.includes("@")
      ? log.UserName.split("@")[0]
      : log.UserName;
    const action = log.ActionType.toLowerCase();

    const recordName = log.RecordName || "record";
    const targetName = log.TargetName;
    const tableName = formatTableName(log.TableName || "");
    const targetTableName = formatTableName(log.TargetTableName || "");

    if (targetName && log.TargetTableName) {
      return `${user} ${action}d ${recordName} to ${targetName}`;
    }

    switch (action) {
      case "create":
        return `${user} added new ${tableName} "${recordName}"`;
      case "update":
        return `${user} updated ${tableName} "${recordName}"`;
      case "delete":
        return `${user} deleted ${tableName} "${recordName}"`;
      default:
        return `${user} ${action}d ${tableName} "${recordName}"`;
    }
  };

  const uniqueModules = [
    ...new Set(auditLogs.map((log) => log.ModuleName).filter(Boolean)),
  ].filter((module) => module && module.trim() !== "") as string[];
  const uniqueUsers = [...new Set(auditLogs.map((log) => log.UserName))].filter(
    (user) => user && user.trim() !== ""
  ) as string[];
  const uniqueActions = [
    ...new Set(auditLogs.map((log) => log.ActionType)),
  ].filter((action) => action && action.trim() !== "") as string[];

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePrevious = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="h-full w-full p-6 pt-5 bg-[#F6F8FC]">
      <h1 className="text-3xl font-semibold my-4">Audit Log</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[220px] h-11 bg-white border border-[#E5E7EB] shadow-none rounded-xl">
            <User className="h-5 w-5 mr-2 text-[#6366F1]" />
            <SelectValue placeholder="Filter by users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map((user) => (
              <SelectItem key={user} value={user}>
                {user.includes("@") ? user.split("@")[0] : user}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-[220px] h-11 bg-white border border-[#E5E7EB] shadow-none rounded-xl">
            <Activity className="h-5 w-5 mr-2 text-[#6366F1]" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger className="w-[220px] h-11 bg-white border border-[#E5E7EB] shadow-none rounded-xl">
            <Activity className="h-5 w-5 mr-2 text-[#6366F1]" />
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {uniqueModules.map((module, index) => (
              <SelectItem key={`${module}-${index}`} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] h-11 bg-white border border-[#E5E7EB] shadow-none rounded-xl text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#6366F1]" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] h-11 bg-white border border-[#E5E7EB] shadow-none rounded-xl text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#6366F1]" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="h-11 px-4 bg-white border border-[#E5E7EB] shadow-none rounded-xl text-primary"
        >
          Clear Filters
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {totalItems} result{totalItems !== 1 ? "s" : ""}
          {totalItems !== auditLogs.length && ` of ${auditLogs.length} total`}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {error
                    ? "Unable to load audit logs."
                    : "No audit logs found matching your filters."}
                </p>
                {!error &&
                  (selectedUser !== "all" ||
                    selectedAction !== "all" ||
                    selectedModule !== "all" ||
                    dateFrom ||
                    dateTo) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear all filters
                    </Button>
                  )}
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date}>
                <h2 className="text-base font-semibold text-gray-700 mb-4">
                  {date}
                </h2>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.AuditLogID}
                      className="flex items-center gap-4 bg-white rounded-xl shadow-sm px-6 py-5"
                    >
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center justify-center rounded-full h-14 w-14 ${getActionCircleColor(
                            log.ActionType
                          )}`}
                        >
                          {getActionIcon(log.ActionType, "h-8 w-8")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-base">
                          {createDescription(log)}
                        </div>
                        {log.ModuleName && (
                          <div className="text-sm text-gray-400 mt-1">
                            {log.ModuleName} module
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 whitespace-nowrap">
                        {new Date(log.CreatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(log.CreatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 my-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="h-10 w-10 p-0 border-gray-300 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNumber)}
                    className={cn(
                      "h-9 w-9 p-0 border-gray-300",
                      currentPage === pageNumber
                        ? "bg-[#1f279c] text-white border-[#1f279c] hover:bg-[#1f279c]"
                        : "bg-[#e8edf3] text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="h-10 w-10 p-0 border-gray-300 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
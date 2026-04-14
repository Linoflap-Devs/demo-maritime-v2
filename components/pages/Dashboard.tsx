"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GrLineChart } from "react-icons/gr";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import Image from "next/image";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import React, { useEffect, useState } from "react";
import {
  getDashboardList,
  DashboardItem,
  SalaryProcessedItem,
} from "@/src/services/dashboard/dashboard.api";
import { ScrollArea } from "@/components/ui/scroll-area";
import axiosInstance from "@/src/lib/axios";
import { getSiteSettings } from "@/src/services/settings/settings.helpers";
import { SettingsItem } from "@/src/services/settings/settings.api";

type Dashboard = {
  TotalVessels: number;
  TotalActiveCrew: number;
  TotalOnBoard: number;
  TotalOffBoard: number;
  ForexRate: number;
  MonthlyAllotmentPHP: number;
  MonthlyAllotmentUSD: number;
  PerVesselAllotmentPHP: {
    [vesselName: string]: number;
  };
  PerVesselAllotmentUSD: {
    [vesselName: string]: number;
  };
  TotalSalaryProcessed: SalaryProcessedItem[];
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] =
    React.useState<DashboardItem | null>(null);
  const [settingsConfig, setSettingsConfig] = useState<SettingsItem[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    getDashboardList()
      .then((res) => {
        if (res.success) {
          setDashboardData(res.data);
        } else {
          console.error("Failed to fetch dashboard data:", res.message);
        }
      })
      .catch((err) => console.error("Error fetching dashboard data:", err));
  }, []);

  useEffect(() => {
    axiosInstance.get("/config").then((res) => {
      if (res.data.success) setSettingsConfig(res.data.data);
    }).finally(() => setLoadingSettings(false));
  }, []);

  const { siteTitle } = getSiteSettings(settingsConfig);

  const formattedSalaryData = React.useMemo(() => {
    if (!dashboardData?.TotalSalaryProcessed) return [];

    return dashboardData.TotalSalaryProcessed.map((item) => {
      const date = new Date(item.MonthYear);

      const monthName = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();

      return {
        month: `${monthName} ${year}`,
        shortMonth: monthName.slice(0, 3),
        salary: item.Value,
        date: date,
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [dashboardData?.TotalSalaryProcessed]);

  const vesselData = React.useMemo(() => {
    if (!dashboardData?.PerVesselAllotmentPHP) return [];

    const colors = [
      "#4F46E5",
      "#60A5FA",
      "#34D399",
      "#F472B6",
      "#A78BFA",
      "#FBBF24",
      "#FB923C",
      "#2DD4BF",
      "#F87171",
      "#818CF8",
      "#C084FC",
      "#FB7185",
      "#38BDF8",
      "#A3E635",
      "#FCD34D",
    ];

    // Convert the object to array format needed by the chart
    return Object.entries(dashboardData.PerVesselAllotmentPHP).map(
      ([name, value], index) => ({
        name,
        value,
        // Cycle through colors if there are more vessels than colors
        fill: colors[index % colors.length],
      })
    );
  }, [dashboardData?.PerVesselAllotmentPHP]);

  // Update the totalVisitors calculation to use the dynamic vesselData
  const totalVesselAllotment = React.useMemo(() => {
    return vesselData.reduce((acc, curr) => acc + curr.value, 0);
  }, [vesselData]);

  const chartConfig = {
    name: {
      label: "Vessel",
    },
    value: {
      label: "Value",
    },
  } satisfies ChartConfig;

  const chartConfig2 = {
    salary: {
      label: "Salary",
      color: "#4F46E5",
    },
  } satisfies ChartConfig;

  interface LegendPayloadItem {
    value: string;
    payload: {
      fill: string;
      name: string;
      value: number;
    };
  }

  const CustomLegend = ({ payload }: { payload?: LegendPayloadItem[] }) => {
    if (!payload) return null;

    return (
      <ScrollArea className="h-[280px] w-full pr-4">
        <div className="grid grid-cols-2 gap-2">
          {payload.map((entry: LegendPayloadItem, index: number) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.payload.fill }}
              />
              <span
                className="text-xs truncate max-w-[130px]"
                title={entry.value}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Detect all-zero case once
  const allZero = React.useMemo(() => {
    return vesselData.length > 0 && vesselData.every((d) => d.value === 0);
  }, [vesselData]);

  // Always ensure something is drawable
  const chartData = React.useMemo(() => {
    if (!vesselData || vesselData.length === 0) {
      // No data → grey placeholder slice
      return [{ name: "No Data", value: 1, fill: "#e5e7eb" }];
    }

    if (allZero) {
      // Replace zeros with tiny value so Pie still renders
      return vesselData.map((d) => ({
        ...d,
        value: 0.0001,
        fill: d.fill ?? "#e5e7eb",
      }));
    }

    // Normal case
    return vesselData;
  }, [vesselData, allZero]);

  return (
    <div className="h-full w-full p-6 pt-3">
      <Card className="my-3">
        <CardContent className="p-3 flex justify-between items-center">
          <div className="pl-6">
            <h1 className="text-3xl font-semibold text-primary mb-1">
              Welcome to {siteTitle || "Company Name"}
            </h1>
            <p className="text-xl text-gray-600">
              Stay updated with the latest allotment payroll details, ensuring
              smooth
            </p>
            <p className="text-xl text-gray-600">
              {" "}
              and timely transactions for all crew members.
            </p>
          </div>
          <div className="relative w-48 h-32 mt-8">
            <Image
              src="/ship-image.png"
              alt="Ship"
              fill
              style={{
                objectFit: "contain",
                transform: "scale(2.5)",
                transformOrigin: "right center",
                paddingBottom: "10px",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <Card className="bg-primary text-white py-3">
          <CardContent className=" pt-0 h-full flex flex-col justify-between gap-y-5">
            <p className="text-xl pt-0">Total Vessel</p>
            <h3 className="text-3xl font-bold self-end mt-4">
              {dashboardData?.TotalVessels ?? 0}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white py-3">
          <CardContent className="pt-0 h-full flex flex-col justify-between gap-y-10">
            <p className="text-xl pt-0">Total Active Crew</p>
            <h3 className="text-3xl font-bold self-end mt-4">
              {dashboardData?.TotalActiveCrew ?? 0}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white py-3">
          <CardContent className="pt-0 h-full flex flex-col justify-between gap-y-5">
            <p className="text-xl pt-0">Total On Board Crew</p>
            <h3 className="text-3xl font-bold self-end mt-4">
              {dashboardData?.TotalOnBoard ?? 0}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white py-3">
          <CardContent className="pt-0 h-full flex flex-col justify-between gap-y-5">
            <p className="text-xl pt-0">Total Off Board Crew</p>
            <h3 className="text-3xl font-bold self-end mt-4">
              {dashboardData?.TotalOffBoard ?? 0}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-y-8">
                <p className="text-lg text-gray-600 mb-6">
                  Current Forex Rate (USD to PHP)
                </p>
                <h3 className="text-xl font-bold">
                  1 USD = {dashboardData?.ForexRate ?? 0} PHP
                </h3>
              </div>
              <div className="text-primary">
                <GrLineChart className="h-20 w-20 mr-5 mt-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-y-0">
                <p className="text-2xl text-primary mt-0 mb-0">
                  {new Date().toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  Total Allotment Process
                </p>
                <h3 className="text-xl font-bold">
                  ₱{" "}
                  {new Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(dashboardData?.NetAllotment ?? 0)}
                </h3>
              </div>
              <div className="text-primary">
                <GrLineChart className="h-20 w-20 mr-5 mt-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-y-8">
                <p className="text-lg text-gray-600 mb-6">
                  Total Gross Allotment
                </p>
                <h3 className="text-xl font-bold">
                  {/* ₱ {totalSalaryProcessed.toFixed(2).toLocaleString()}P{" "} */}
                  ₱{" "}
                  {new Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(dashboardData?.MonthlyAllotmentPHP ?? 0)}
                </h3>
              </div>
              <div className="text-primary">
                <GrLineChart className="h-20 w-20 mr-5 mt-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-lg">Total Vessel Net Allottment</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={100}
                    outerRadius={140}
                    strokeWidth={4}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {allZero
                                  ? "0"
                                  : totalVesselAllotment?.toLocaleString() ?? "—"}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <Legend
                    content={<CustomLegend />}
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ marginLeft: 16 }}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-lg">
              Total Salary Processed (₱)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig2} className="w-full h-full">
                <AreaChart
                  accessibilityLayer
                  data={formattedSalaryData}
                  margin={{
                    left: 40,
                    right: 12,
                    top: 10,
                    bottom: 0,
                  }}>
                  <defs>
                    <linearGradient
                      id="colorDesktop"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#4F46E5"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="shortMonth"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    style={{ fontSize: "12px" }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (
                        active &&
                        payload &&
                        payload.length &&
                        payload[0]?.value !== undefined
                      ) {
                        // const value = payload[0].value as number;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Month
                                </span>
                                <span className="font-bold text-foreground">
                                  {payload[0].payload.month}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Value
                                </span>
                                <span className="font-bold text-foreground">
                                  ₱{payload[0].value.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    dataKey="salary"
                    type="natural"
                    fill="var(--primary)"
                    stroke="var(--primary)"
                    name="Total Salary"
                    dot={{
                      fill: "var(--primary",
                      strokeWidth: 2,
                      r: 3,
                      stroke: "white",
                    }}
                    activeDot={{
                      fill: "#4F46E5",
                      strokeWidth: 2,
                      r: 4,
                      stroke: "white",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ marginTop: -10, fontSize: "12px" }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

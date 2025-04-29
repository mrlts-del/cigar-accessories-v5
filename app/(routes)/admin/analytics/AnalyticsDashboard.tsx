"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
// Removed unused Input import
// CSV export: requires 'react-csv' package. Install with: npm install react-csv
import { CSVLink } from "react-csv";
import Filters from "./Filters";
import LoadingContent from "@/app/components/ui/loading-content";
// Charting: requires 'recharts' package. Install with: npm install recharts
import {
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
} from "recharts";

type TimeRange = "daily" | "weekly" | "monthly";

const defaultFilters = {
  timeRange: "monthly" as TimeRange,
  product: "",
  category: "",
};

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState(defaultFilters);

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useSWR(
    `/api/analytics/kpis?timeRange=${filters.timeRange}&product=${filters.product}&category=${filters.category}`
  );
  // Fetch chart data
  const { data: chartData, isLoading: chartLoading, error: chartError } = useSWR(
    `/api/analytics/revenue?timeRange=${filters.timeRange}&product=${filters.product}&category=${filters.category}`
  );
  // Fetch product performance
  const { data: productPerf, isLoading: prodPerfLoading, error: prodPerfError } = useSWR(
    `/api/analytics/products?timeRange=${filters.timeRange}&product=${filters.product}&category=${filters.category}`
  );

  // Loading, error, and empty states
  const isLoading = kpisLoading || chartLoading || prodPerfLoading;
  const isError = kpisError || chartError || prodPerfError;
  const isEmpty = !kpis && !chartData && !productPerf && !isLoading && !isError;

  // CSV export data
  const csvData = [
    ...(chartData?.data || []),
    ...(productPerf?.data || []),
  ];

  return (
    <div className="space-y-6">
      <Filters filters={filters} setFilters={setFilters} />
      {isLoading ? (
        <LoadingContent description="Loading analytics data..." />
      ) : isError ? (
        <Card className="p-8 text-center text-red-500">Error loading analytics data. Please try again later.</Card>
      ) : isEmpty ? (
        <Card className="p-8 text-center text-gray-500">No analytics data found for the selected filters.</Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-gray-500">Sales</div>
              <div className="text-xl font-bold">{kpis?.sales ?? "--"}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Revenue</div>
              <div className="text-xl font-bold">{kpis?.revenue ?? "--"}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Orders</div>
              <div className="text-xl font-bold">{kpis?.orders ?? "--"}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Customers</div>
              <div className="text-xl font-bold">{kpis?.customers ?? "--"}</div>
            </Card>
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="p-4">
              <div className="font-semibold mb-2">Revenue Over Time</div>
              {chartData?.data?.length ? (
                <LineChart width={350} height={200} data={chartData.data}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                </LineChart>
              ) : (
                <div className="text-gray-400 text-sm">No revenue data.</div>
              )}
            </Card>
            <Card className="p-4">
              <div className="font-semibold mb-2">Product Performance</div>
              {productPerf?.data?.length ? (
                <BarChart width={350} height={200} data={productPerf.data}>
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#82ca9d" />
                </BarChart>
              ) : (
                <div className="text-gray-400 text-sm">No product data.</div>
              )}
            </Card>
          </div>
          {/* Export to CSV */}
          <div className="mt-6 flex justify-end">
            <CSVLink
              data={csvData}
              filename={`analytics-${filters.timeRange}.csv`}
              className="btn btn-outline"
            >
              <Button variant="outline">Export to CSV</Button>
            </CSVLink>
          </div>
        </>
      )}
    </div>
  );
}
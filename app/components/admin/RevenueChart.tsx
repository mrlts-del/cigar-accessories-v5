'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming ShadCN Select is installed
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRevenueData } from "@/hooks/useAdminAnalytics";
import { format } from 'date-fns';

type TimeRange = 'daily' | 'weekly' | 'monthly';

// Helper to format currency for the tooltip/axis
const formatCurrencyAxis = (value: number) => `$${(value / 1000).toFixed(0)}k`;

// Helper to format date labels based on range
const formatDateLabel = (dateStr: string, range: TimeRange): string => {
  try {
    if (range === 'daily') {
      return format(new Date(dateStr), 'MMM d'); // e.g., Apr 17
    } else if (range === 'weekly') {
      // Assuming dateStr is 'YYYY-Www'
      return `Week ${dateStr.split('-W')[1]}`;
    } else { // monthly
      // Assuming dateStr is 'YYYY-MM'
      return format(new Date(`${dateStr}-02`), 'MMM yyyy'); // Use day 2 to avoid timezone issues
    }
  } catch (e) {
    console.error("Error formatting date:", dateStr, range, e);
    return dateStr; // Fallback
  }
};

export function RevenueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const { data: revenueResponse, isLoading, error } = useRevenueData(timeRange);

  const chartData = revenueResponse?.revenue?.map(item => ({
    ...item,
    // Format date for display on X-axis
    displayDate: formatDateLabel(item.date, timeRange),
  })) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Revenue Overview</CardTitle>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Last 30 Days</SelectItem>
            <SelectItem value="weekly">Last 12 Weeks</SelectItem>
            <SelectItem value="monthly">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-6">
        {isLoading && <Skeleton className="h-full w-full" />}
        {error && <p className="text-destructive">Error loading revenue data: {error.message}</p>}
        {!isLoading && !error && chartData.length === 0 && <p>No revenue data available for this period.</p>}
        {!isLoading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10, // Adjusted margin
                left: 10,  // Adjusted margin
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis
                dataKey="displayDate"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrencyAxis}
              />
              <Tooltip
                formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), "Revenue"]}
                labelFormatter={(label) => label} // Use the formatted displayDate
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc' }}
                itemStyle={{ color: '#8884d8' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false} // Hide dots for cleaner look with many points
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProductAnalytics } from "@/hooks/useAdminAnalytics";

// Helper to truncate long product names
const truncateName = (name: string, maxLength = 25) => {
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

export function TopProductsChart() {
  // Fetch daily data for the last 30 days to aggregate
  const { data: productResponse, isLoading, error } = useProductAnalytics('daily');

  const topProducts = useMemo(() => {
    if (!productResponse?.products) {
      return [];
    }

    // Aggregate sales per product over the period
    const productTotals: Record<string, { name: string; totalSales: number }> = {};
    productResponse.products.forEach(p => {
      if (!productTotals[p.productId]) {
        productTotals[p.productId] = { name: p.productName, totalSales: 0 };
      }
      productTotals[p.productId].totalSales += p.sales;
    });

    // Get top 5 products by sales quantity
    return Object.values(productTotals)
      .sort((a, b) => b.totalSales - a.totalSales) // Sort descending by sales
      .slice(0, 5) // Take top 5
      .map(p => ({
        name: truncateName(p.name), // Use truncated name for chart label
        sales: p.totalSales,
      }));

  }, [productResponse]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products (Last 30 Days by Quantity)</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-6">
        {isLoading && <Skeleton className="h-full w-full" />}
        {error && <p className="text-destructive">Error loading product analytics: {error.message}</p>}
        {!isLoading && !error && topProducts.length === 0 && <p>No product sales data available.</p>}
        {!isLoading && !error && topProducts.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProducts}
              layout="vertical" // Vertical layout looks good for top lists
              margin={{
                top: 5,
                right: 30,
                left: 50, // Increased left margin for longer labels
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                width={100} // Adjust width for labels
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "Units Sold"]}
                labelFormatter={(label) => label} // Use the truncated name
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#82ca9d" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
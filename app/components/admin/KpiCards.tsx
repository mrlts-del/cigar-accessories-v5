'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useKpiData } from "@/hooks/useAdminAnalytics";
import { useMemo } from "react";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function KpiCards() {
  // Fetch daily data for the last 30 days by default
  const { data: kpiResponse, isLoading, error } = useKpiData('daily');

  const totals = useMemo(() => {
    if (!kpiResponse) {
      return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 };
    }
    // Use the values directly from the kpiResponse object
    return {
      totalRevenue: kpiResponse.totalRevenue.value,
      totalOrders: kpiResponse.totalOrders.value,
      totalCustomers: kpiResponse.totalCustomers.value,
    };
  }, [kpiResponse]);

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-sm font-medium text-destructive">Error Loading KPIs</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-destructive">{error.message}</p></CardContent>
        </Card>
         {/* Render empty cards or skeletons for layout consistency */}
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
          )}
          {/* Placeholder for percentage change - requires previous period data */}
          {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <Skeleton className="h-8 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">+{totals.totalOrders.toLocaleString()}</div>
          )}
          {/* <p className="text-xs text-muted-foreground">+180.1% from last month</p> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <Skeleton className="h-8 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">+{totals.totalCustomers.toLocaleString()}</div>
          )}
          {/* <p className="text-xs text-muted-foreground">+19% from last month</p> */}
        </CardContent>
      </Card>
       {/* Placeholder for Active Products - requires a different data source */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
          {/* <div className="text-2xl font-bold">573</div> */}
          {/* <p className="text-xs text-muted-foreground">+2 since last hour</p> */}
        </CardContent>
      </Card>
    </div>
  );
}
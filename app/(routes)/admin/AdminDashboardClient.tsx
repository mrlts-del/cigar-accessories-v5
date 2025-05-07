"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import components with ssr: false
const KpiCards = dynamic(() => import('@/app/components/admin/KpiCards').then(mod => mod.KpiCards), {
  loading: () => <Skeleton className="h-24 w-full" />,
  ssr: false
});

const RevenueChart = dynamic(() => import('@/app/components/admin/RevenueChart').then(mod => mod.RevenueChart), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
});

const TopProductsChart = dynamic(() => import('@/app/components/admin/TopProductsChart').then(mod => mod.TopProductsChart), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
});

const RecentOrdersTable = dynamic(() => import('@/app/components/admin/RecentOrdersTable').then(mod => mod.RecentOrdersTable), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

export default function AdminDashboardClient() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Dashboard Overview</h1>

      {/* KPI Cards */}
      <KpiCards />

      {/* Main Charts Area */}
      <div className="grid gap-8 lg:grid-cols-2">
        <RevenueChart />
        <TopProductsChart />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable />
    </div>
  );
}
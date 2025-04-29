'use client';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading states
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

// Dynamically import components
const KpiCards = dynamicImport(() => import('@/app/components/admin/KpiCards').then(mod => mod.KpiCards), {
  loading: () => <Skeleton className="h-24 w-full" />, // Basic skeleton for KPI cards area
  ssr: false // Often good for client-heavy components
});

const RevenueChart = dynamicImport(() => import('@/app/components/admin/RevenueChart').then(mod => mod.RevenueChart), {
  loading: () => <Skeleton className="h-64 w-full" />, // Skeleton for chart area
  ssr: false
});

const TopProductsChart = dynamicImport(() => import('@/app/components/admin/TopProductsChart').then(mod => mod.TopProductsChart), {
  loading: () => <Skeleton className="h-64 w-full" />, // Skeleton for chart area
  ssr: false
});

const RecentOrdersTable = dynamicImport(() => import('@/app/components/admin/RecentOrdersTable').then(mod => mod.RecentOrdersTable), {
  loading: () => <Skeleton className="h-96 w-full" />, // Skeleton for table area
  ssr: false
});
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<LoadingContent description="Loading dashboard..." />}>
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
    </Suspense>
  );
}
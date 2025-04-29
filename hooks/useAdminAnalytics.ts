'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios'; // Assuming axios is used, or use fetch
import type { AnalyticsKpisResponse } from '@/app/api/analytics/kpis/route';
import type { AnalyticsRevenueResponse } from '@/app/api/analytics/revenue/route';
import type { GetAdminOrdersResponse } from '@/app/api/admin/orders/route';
import type { AnalyticsProductsResponse } from '@/app/api/analytics/products/route';

// Helper function for fetching data
const fetchData = async <T>(url: string): Promise<T> => {
  const { data } = await axios.get<T>(url);
  return data;
};

// Hook for KPI data
export const useKpiData = (range: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  return useQuery<AnalyticsKpisResponse, Error>({
    queryKey: ['adminKpis', range],
    queryFn: () => fetchData<AnalyticsKpisResponse>(`/api/analytics/kpis?range=${range}`),
  });
};

// Hook for Revenue data
export const useRevenueData = (range: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  return useQuery<AnalyticsRevenueResponse, Error>({
    queryKey: ['adminRevenue', range],
    queryFn: () => fetchData<AnalyticsRevenueResponse>(`/api/analytics/revenue?range=${range}`),
  });
};

// Hook for Recent Orders
export const useRecentOrders = (limit: number = 5) => {
  return useQuery<GetAdminOrdersResponse, Error>({
    queryKey: ['adminRecentOrders', limit],
    queryFn: () => fetchData<GetAdminOrdersResponse>(`/api/admin/orders?limit=${limit}&sortBy=createdAt&sortOrder=desc`),
    // Keep data fresh for a short period or refetch as needed
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for Product Analytics data
export const useProductAnalytics = (range: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  return useQuery<AnalyticsProductsResponse, Error>({
    queryKey: ['adminProductAnalytics', range],
    queryFn: () => fetchData<AnalyticsProductsResponse>(`/api/analytics/products?range=${range}`),
  });
};
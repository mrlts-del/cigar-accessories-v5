// app/(routes)/admin/orders/components/OrderListClient.tsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"; // Trying app/components path
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingContent from '@/app/components/ui/loading-content'; // Use default import
import { GetAdminOrdersResponse } from '@/app/api/admin/orders/route'; // Import response type
import { format } from 'date-fns'; // For date formatting
// Removed unused cn import

// Helper function to fetch data for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        throw new Error('Failed to fetch orders');
    }
    return res.json();
});

// Helper to determine badge variant based on status
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'PENDING': return 'outline';
        case 'PAID': return 'secondary';
        case 'SHIPPED': return 'default';
        case 'DELIVERED': return 'default'; // Consider a 'success' variant if available
        case 'CANCELLED': return 'destructive';
        case 'REFUNDED': return 'destructive';
        default: return 'outline';
    }
};

export default function OrderListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  // Add other params like sortBy, sortOrder, status, search later

  const apiUrl = `/api/admin/orders?page=${page}&limit=${limit}`; // Construct API URL

  const { data, error, isLoading } = useSWR<GetAdminOrdersResponse>(apiUrl, fetcher);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
  };

  if (isLoading) {
    return <LoadingContent description="Loading orders..." />;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error loading orders: {error.message}</div>;
  }

  if (!data) {
    // Should ideally not happen if not loading and no error, but good practice
    return <div className="p-4">No data available.</div>;
  }

  // Render table if data is available
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No orders found.
              </TableCell>
            </TableRow>
          )}
          {data.orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                  #{order.id.substring(0, 8)}...
                </Link>
              </TableCell>
              <TableCell>{order.user?.name || order.user?.email || 'N/A'}</TableCell>
              <TableCell>{format(new Date(order.createdAt), 'PPpp')}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/orders/${order.id}`}>View</Link>
                </Button>
                {/* Add Status Update Dropdown here later */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {data.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.pagination.currentPage - 1)}
            disabled={data.pagination.currentPage <= 1}
          >
            Previous
          </Button>
          <span>
            Page {data.pagination.currentPage} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.pagination.currentPage + 1)}
            disabled={data.pagination.currentPage >= data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
'use client';

import { useRecentOrders } from "@/hooks/useAdminAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Use ShadCN Table
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper to determine badge variant based on status (consistent with order detail page)
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toUpperCase()) { // Added safety check for status
        case 'PENDING': return 'outline';
        case 'PAID': return 'secondary';
        case 'SHIPPED': return 'default';
        case 'DELIVERED': return 'default';
        case 'CANCELLED': return 'destructive';
        case 'REFUNDED': return 'destructive';
        default: return 'outline';
    }
};

export function RecentOrdersTable() {
  const { data: ordersResponse, isLoading, error } = useRecentOrders(5); // Fetch latest 5 orders

  const orders = ordersResponse?.orders || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {error && <p className="text-destructive">Error loading recent orders: {error.message}</p>}
        {!isLoading && !error && orders.length === 0 && <p>No recent orders found.</p>}
        {!isLoading && !error && orders.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      #{order.id.substring(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>{order.user?.name || order.user?.email || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{order.status || 'UNKNOWN'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
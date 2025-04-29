export const dynamic = 'force-dynamic';
// app/(routes)/admin/orders/page.tsx
import React, { Suspense } from 'react';
// We'll create this client component next
import OrderListClient from './components/OrderListClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Import Separator
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

export default function AdminOrdersPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Order Management</h1>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          {/* Add description or filters here later if needed */}
        </CardHeader>
        <CardContent>
          {/* This client component will handle fetching and displaying orders */}
          <Suspense fallback={<LoadingContent description="Loading orders..." />}>
            <OrderListClient />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
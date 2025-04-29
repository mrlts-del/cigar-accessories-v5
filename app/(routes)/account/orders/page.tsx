'use client';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

import { fetcher, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderItem {
  id: string;
  variantId: string;
  quantity: number;
  price: Decimal;
  variant: {
    id: string;
    productId: string;
    size: string | null;
    color: string | null;
    sku: string;
    inventory: number;
    price: Decimal;
    product: {
      id: string;
      name: string;
      description: string;
      slug: string;
      price: Decimal;
      imagePath: string | null;
    };
  };
}

interface Order {
  id: string;
  userId: string;
  status: string; // Assuming status is a string for now
  createdAt: string; // Assuming date is a string
  updatedAt: string;
  items: OrderItem[];
}

const OrdersPage = () => {
  const { data: orders, error, isLoading } = useSWR<Order[]>('/api/orders/me', fetcher);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-center text-destructive">
            Failed to load orders.
          </div>
        )}
        {orders && orders.length === 0 && (
          <div className="text-center text-muted-foreground">
            No orders found.
          </div>
        )}
        {orders && orders.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'PPP')}</TableCell>
                    <TableCell>
                      {formatPrice(
                        order.items.reduce(
                          (total, item) => total + item.price.toNumber() * item.quantity,
                          0
                        )
                      )}
                    </TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
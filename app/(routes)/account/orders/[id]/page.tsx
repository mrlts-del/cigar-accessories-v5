'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams, notFound } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button'; // Corrected path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Corrected path
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Corrected path
import LoadingContent from '@/app/components/ui/loading-content';
import { Badge } from '@/components/ui/badge'; // Corrected path
import { Separator } from '@/components/ui/separator'; // Corrected path

// Define structure for Order Item
interface OrderItem {
  id: string;
  quantity: number;
  price: number; // Price per unit at the time of order
  product: {
    id: string;
    name: string;
    image: string | null;
    slug: string; // For linking back to product page
  };
}

// Define structure for Shipping Address (can reuse Address interface if suitable)
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Add name, phone if available
}

// Define structure for detailed Order
interface OrderDetails {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null; // Address might be optional depending on product type
  // Add other fields like payment method, shipping cost, etc. if available
}

// Function to fetch specific order details
const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  const { data } = await axios.get<OrderDetails>(`/api/orders/${orderId}`);
  return data;
};

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Helper to format date
const formatDate = (dateString: string) => {
    try {
        return format(new Date(dateString), 'PPP p'); // e.g., Jun 21, 2024, 4:30 PM
    } catch {
        return 'Invalid Date';
    }
}

// Helper to get badge variant based on status (same as in orders list)
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toUpperCase()) {
        case 'PENDING':
        case 'PROCESSING':
            return 'secondary';
        case 'SHIPPED':
            return 'default';
        case 'DELIVERED':
            return 'default';
        case 'CANCELLED':
            return 'destructive';
        default:
            return 'outline';
    }
}

export default function OrderDetailPage() {
  const { status } = useSession({ required: true });
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, isError, error } = useQuery<OrderDetails, AxiosError>(
    ['orderDetails', orderId],
    () => fetchOrderDetails(orderId),
    {
      enabled: status === 'authenticated' && !!orderId, // Only fetch if authenticated and orderId is present
      retry: false, // Don't retry on 404 or auth errors
    }
  );

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return <LoadingContent description="Loading order details..." />;
  }

  // Handle not found (e.g., API returns 404) or other errors
  if (isError) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound(); // Trigger Next.js not found page
    }
    // Generic error display
    return <p className="text-red-500">Error loading order: {axios.isAxiosError(error) && typeof error.response?.data === 'object' && error.response.data && 'message' in error.response.data ? String(error.response.data.message) : error?.message}</p>;
  }

  if (!order) {
    // Should be caught by isError or isLoading, but as a fallback
    return <p>Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Order ID: #{order.id}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(order.status)} className="text-sm">{order.status}</Badge>
          </div>
          <div className="text-sm text-muted-foreground pt-2">
            Placed on: {formatDate(order.createdAt)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Items Ordered</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image
                        src={item.product.image || '/placeholder.png'}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="rounded object-cover aspect-square"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                        {item.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Shipping & Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            {order.shippingAddress && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                  {/* Add name/phone if available */}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className={!order.shippingAddress ? 'md:col-start-2' : ''}>
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {/* Add subtotal, shipping, tax rows if available from API */}
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
             <Button asChild variant="outline">
                <Link href="/account/orders">Back to Orders</Link>
             </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
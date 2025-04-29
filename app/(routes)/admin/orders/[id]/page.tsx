// app/(routes)/admin/orders/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import Image from 'next/image';
import type { Order, OrderItem, User, Payment, Address, Variant, OrderStatus } from '@prisma/client'; // Removed unused Product type
import OrderStatusUpdater from './components/OrderStatusUpdater'; // Import the component

// Helper to determine badge variant based on status (copied from OrderListClient)
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'PENDING': return 'outline';
        case 'PAID': return 'secondary';
        case 'SHIPPED': return 'default';
        case 'DELIVERED': return 'default';
        case 'CANCELLED': return 'destructive';
        case 'REFUNDED': return 'destructive';
        default: return 'outline';
    }
};

// Helper function to format currency
const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Define a comprehensive type for the detailed order structure
type DetailedAdminOrder = Order & {
  calculatedTotal: number;
  user: Pick<User, 'id' | 'name' | 'email'> | null;
  items: (OrderItem & {
    variant: Variant & {
      product: { id: string; name: string; image: string | null }; // Reverted: Use image field as confirmed by API
    };
  })[];
  payment: Payment | null;
  shippingAddr: Address | null;
  billingAddr: Address | null;
};

// Fetch order data directly in the server component
async function getOrderDetails(orderId: string): Promise<DetailedAdminOrder | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        // Or redirect to login
        throw new Error("Not authenticated");
    }

    // Let TS infer the type from the Prisma query result
    const order = await prisma.order.findUnique({
        where: { id: orderId, deletedAt: null },
        include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
                include: {
                    variant: {
                        include: {
                            product: { // Explicitly select fields matching DetailedAdminOrder type
                              select: {
                                id: true,
                                name: true,
                              }
                            }
                        }
                    }
                }
            },
            payment: true,
            shippingAddr: true,
            billingAddr: true,
        },
    });

    if (!order) {
        return null; // Let the component handle notFound
    }

    // Authorization check: Allow if user is ADMIN or owns the order
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOwner = order.userId === session.user.id;

    if (!isAdmin && !isOwner) {
        throw new Error("Forbidden"); // Or handle appropriately
    }

    // Assert the type before calculating total
    // No need to assert here, calculation uses order.items directly
    // const orderWithItems = order as DetailedAdminOrder;
    const orderWithItems = order; // Use the fetched order directly for calculation

    // Calculate total using the asserted type
    // Explicitly assert the type here to ensure TS knows 'items' exists
    const total = (orderWithItems as DetailedAdminOrder).items.reduce((sum, item) => {
        // Ensure price is treated as a number for calculation
        const price = typeof item.price === 'number' ? item.price : Number(item.price);
        return sum + (item.quantity * price);
    }, 0);

    // Cast to the detailed type before returning
    return { ...order, calculatedTotal: total } as DetailedAdminOrder;
}


export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
    const id = params.id; // Use id from the route parameter
    // Explicitly type the order variable
    let order: DetailedAdminOrder | null = null;
    try {
        order = await getOrderDetails(id); // Pass the correct id
    } catch (error: unknown) { // Use unknown for better type safety
        // Handle auth errors, maybe redirect or show specific message
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error fetching order details:", message, error); // Log original error too
        // For now, treat as not found or forbidden
        if (message === "Forbidden") {
             return <div className="p-6 text-red-600">Access Forbidden</div>; // Or redirect
        }
         if (message === "Not authenticated") {
             return <div className="p-6 text-red-600">Not Authenticated</div>; // Or redirect
        }
        // Treat other errors as not found for simplicity
        notFound();
    }


    if (!order) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Order Details</h1>
                {/* Add Back button or breadcrumbs here */}
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Order Summary Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Order #{order.id.substring(0, 8)}...</CardTitle>
                        <CardDescription>
                            Placed on {format(new Date(order.createdAt), 'PPP p')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                        </div>
                        {/* Render Status Updater Component */}
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status as OrderStatus} />
                        <Separator />
                        <h3 className="font-semibold">Items</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item: DetailedAdminOrder['items'][0]) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="flex items-center space-x-2">
                                             <Image
                                                src={item.variant.product.image || '/placeholder.png'} // Provide a placeholder
                                                alt={item.variant.product.name}
                                                width={40}
                                                height={40}
                                                className="rounded object-cover"
                                            />
                                            <span>{item.variant.product.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            {/* Display variant details like size/color if they exist */}
                                            {item.variant.size || item.variant.color ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim() : 'Standard'}
                                        </TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(item.price))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.quantity * Number(item.price))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Separator />
                        <div className="flex justify-end">
                            <div className="text-right">
                                <p className="text-muted-foreground">Subtotal: {formatCurrency(order.calculatedTotal)}</p>
                                {/* Add Shipping, Taxes if applicable */}
                                <p className="font-semibold text-lg">Total: {formatCurrency(order.calculatedTotal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer & Address Card */}
                <Card className="space-y-4">
                    <CardHeader>
                        <CardTitle>Customer & Shipping</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold">Customer</h4>
                            <p>{order.user?.name || 'N/A'}</p>
                            <p>{order.user?.email || 'N/A'}</p>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold">Shipping Address</h4>
                            {order.shippingAddr ? (
                                <address className="not-italic text-sm">
                                    {order.shippingAddr.line1}<br />
                                    {order.shippingAddr.line2 && <>{order.shippingAddr.line2}<br /></>}
                                    {order.shippingAddr.city}, {order.shippingAddr.state} {order.shippingAddr.postal}<br />
                                    {order.shippingAddr.country}
                                </address>
                            ) : <p>No shipping address provided.</p>}
                        </div>
                        {/* Optionally show Billing Address if different */}
                        {order.billingAddr && order.billingAddrId !== order.shippingAddrId && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold">Billing Address</h4>
                                    <address className="not-italic text-sm">
                                        {order.billingAddr.line1}<br />
                                        {order.billingAddr.line2 && <>{order.billingAddr.line2}<br /></>}
                                        {order.billingAddr.city}, {order.billingAddr.state} {order.billingAddr.postal}<br />
                                        {order.billingAddr.country}
                                    </address>
                                </div>
                            </>
                        )}
                         <Separator />
                         <div>
                            <h4 className="font-semibold">Payment</h4>
                            {order.payment ? (
                                <>
                                    <p>Status: <Badge variant={order.payment.status === 'COMPLETED' ? 'secondary' : 'outline'}>{order.payment.status}</Badge></p>
                                    <p>Provider: {order.payment.provider}</p>
                                    <p>Amount: {formatCurrency(Number(order.payment.amount))}</p>
                                    <p>Transaction ID: {order.payment.transactionId.substring(0,12)}...</p>
                                </>
                            ) : <p>No payment details found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
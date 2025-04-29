import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Assuming Badge component exists
// Removed unused Separator import
import { Button } from '@/components/ui/button';
import Image from 'next/image'; // Import next/image
import { ArrowLeft } from 'lucide-react';

// Define the expected shape of the API response for a single user
// Should match the select clause in the API route
interface AddressData {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country: string;
  type: string; // e.g., 'SHIPPING', 'BILLING'
}

interface OrderSummaryData {
  id: string;
  status: string;
  payment?: { amount: number | null } | null; // Amount from related payment
  createdAt: string; // ISO string format
}

interface UserDetailData {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  role: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  addresses: AddressData[];
  orders: OrderSummaryData[];
}

// Server-side data fetching function
async function getUserDetails(userId: string): Promise<UserDetailData | null> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users/${userId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Cookie: cookies().toString(),
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (response.status === 404) {
      return null; // User not found
    }

    if (!response.ok) {
      console.error(`Error fetching user details: ${response.status} ${response.statusText}`);
      // Consider throwing an error or returning a specific error state
      return null;
    }

    const data: UserDetailData = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch user details for ${userId}:`, error);
    return null;
  }
}

// The Page component (Server Component)
export default async function AdminCustomerDetailPage({ params }: { params: { userId: string } }) {
  const user = await getUserDetails(params.userId);

  if (!user) {
    notFound(); // Trigger 404 page if user not found
  }

  const formatAddress = (addr: AddressData) => {
    return `${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}, ${addr.city}, ${addr.state} ${addr.postal}, ${addr.country}`;
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Back Button */}
      <Link href="/admin/customers">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </Link>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {user.image && (
              <Image src={user.image} alt={user.name || 'User Avatar'} width={64} height={64} className="rounded-full" />
            )}
            <div>
              <CardTitle>{user.name || 'Unnamed User'}</CardTitle>
              <CardDescription>{user.email || 'No email provided'}</CardDescription>
              <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="mt-1">
                {user.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>User ID: {user.id}</p>
          <p>Joined: {format(new Date(user.createdAt), 'PPP')}</p>
          <p>Last Updated: {format(new Date(user.updatedAt), 'PPP p')}</p>
        </CardContent>
      </Card>

      {/* Addresses Card */}
      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {user.addresses.length > 0 ? (
            <ul className="space-y-3">
              {user.addresses.map((addr) => (
                <li key={addr.id} className="text-sm border-b pb-2 last:border-b-0">
                  <Badge variant="outline" className="mr-2 capitalize">{addr.type.toLowerCase()}</Badge>
                  {formatAddress(addr)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No addresses found for this user.</p>
          )}
        </CardContent>
      </Card>

      {/* Order History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Order History (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium truncate max-w-[150px]">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
                    <TableCell>
                      {order.payment?.amount != null ? `$${order.payment.amount.toFixed(2)}` : 'N/A'}
                    </TableCell>
                     <TableCell>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">View Order</Button>
                        </Link>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No orders found for this user.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
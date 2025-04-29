"use client";

import useSWR from "swr";
// Removed unused useToast import
import { Button } from "@/components/ui/button"; // Corrected path
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Corrected path and added specific components
// Removed unused useState import

type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};

type Order = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingAddr: Address | null;
  billingAddr: Address | null;
};

type UserDetailProps = {
  userId: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  orders: Order[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingContent({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: Error | null | undefined; // Use Error type
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        Failed to load user details. Please try again.
      </div>
    );
  }
  return <>{children}</>;
}

export default function UserDetail({ userId }: UserDetailProps) {
  // Removed unused mutate variable
  const { data, isLoading, error } = useSWR<User>(
    `/api/users/${userId}`,
    fetcher
  );
  // Removed unused toast variable
  // Removed unused showEdit and showDelete state variables

  // Placeholder handlers for edit/delete
  const handleEdit = () => { /* TODO: Implement edit modal */ };
  const handleDelete = () => { /* TODO: Implement delete modal */ };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <LoadingContent loading={isLoading} error={error}>
        {data && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">{data.name}</h2>
                <div className="text-gray-600">{data.email}</div>
                <div className="text-sm text-gray-500 capitalize">
                  Role: {data.role.toLowerCase()}
                </div>
                <div className="text-xs text-gray-400">
                  Joined: {new Date(data.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleEdit}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
            {/* Addresses */}
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Addresses</h3>
              {data.addresses.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border rounded p-3 bg-gray-50 text-sm"
                    >
                      <div>{addr.street}</div>
                      <div>
                        {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                      <div>{addr.country}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No addresses found.</div>
              )}
            </div>
            {/* Order History */}
            <div>
              <h3 className="font-semibold mb-2">Order History</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Shipping</TableHead>
                      <TableHead>Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.length ? (
                      data.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell className="capitalize">{order.status}</TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {order.shippingAddr
                              ? `${order.shippingAddr.street}, ${order.shippingAddr.city}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {order.billingAddr
                              ? `${order.billingAddr.street}, ${order.billingAddr.city}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* TODO: Edit and Delete modals */}
            {/* {showEdit && <UserEditModal ... />} */}
            {/* {showDelete && <DeleteUserModal ... />} */}
          </>
        )}
      </LoadingContent>
    </div>
  );
}
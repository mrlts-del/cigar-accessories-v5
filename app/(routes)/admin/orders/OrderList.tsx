"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
// Removed unused useToast import
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import StatusUpdateModal from "./StatusUpdateModal";
import DeleteOrderModal from "./DeleteOrderModal";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

// Define an interface for the order data structure used in this list
interface OrderSummary {
  id: string;
  customerName?: string | null;
  customerEmail?: string | null;
  status: string;
  total?: number | null;
  createdAt?: string | null; // Assuming ISO string
}

export default function OrderList() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  // Removed unused toast variable (re-evaluate if needed later)

  // Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null); // Use OrderSummary type

  const query = new URLSearchParams();
  if (status) query.append("status", status);
  if (search) query.append("search", search);
  query.append("page", String(page));

  const { data, isLoading, error, mutate } = useSWR(
    `/api/orders?${query.toString()}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load orders. Please try again.
      </div>
    );
  }

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input
              placeholder="Search by customer, order ID, or email"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStatus("");
              setSearch("");
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: OrderSummary) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 underline"
                      >
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.customerName || order.customerEmail || "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-semibold",
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "shipped"
                            ? "bg-indigo-100 text-indigo-800"
                            : order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      ${order.total?.toFixed(2) ?? "0.00"}
                    </TableCell>
                    <TableCell>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusModalOpen(true);
                          }}
                        >
                          Update Status
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {/* Status Update Modal */}
      {selectedOrder && (
        <StatusUpdateModal
          open={statusModalOpen}
          onOpenChange={open => {
            setStatusModalOpen(open);
            if (!open) setSelectedOrder(null);
          }}
          orderId={selectedOrder.id}
          currentStatus={selectedOrder.status}
          onSuccess={mutate}
        />
      )}
      {/* Delete Confirmation Modal */}
      {selectedOrder && (
        <DeleteOrderModal
          open={deleteModalOpen}
          onOpenChange={open => {
            setDeleteModalOpen(open);
            if (!open) setSelectedOrder(null);
          }}
          orderId={selectedOrder.id}
          onSuccess={mutate}
        />
      )}
    </>
  );
}
"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast"; // Removed unused useToast import
import { Loader2 } from "lucide-react";
import StatusUpdateModal from "../StatusUpdateModal";
import DeleteOrderModal from "../DeleteOrderModal";

interface OrderDetailProps {
  orderId: string;
}

// Define interface for order item
interface OrderItemData {
  id: string;
  productName: string;
  quantity: number;
  price?: number | null;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const { data, isLoading, error, mutate } = useSWR(
    `/api/orders/${orderId}`,
    fetcher
  );
  // Removed unused toast variable

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load order. Please try again.
      </div>
    );
  }

  const order = data.order;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Order #{order.id}</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusModalOpen(true)}
          >
            Update Status
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <span className="font-semibold">Status:</span>{" "}
        <span className="capitalize">{order.status}</span>
      </div>
      <div className="mb-4">
        <span className="font-semibold">Customer:</span>{" "}
        {order.customerName || order.customerEmail || "-"}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Total:</span> ${order.total?.toFixed(2) ?? "0.00"}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Created:</span>{" "}
        {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Payment:</span>{" "}
        {order.paymentStatus || "-"}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Shipping Address:</span>
        <div className="ml-2">
          {order.shippingAddress
            ? (
              <>
                <div>{order.shippingAddress.name}</div>
                <div>{order.shippingAddress.line1}</div>
                <div>{order.shippingAddress.line2}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </div>
                <div>{order.shippingAddress.country}</div>
              </>
            )
            : "-"}
        </div>
      </div>
      <div className="mb-4">
        <span className="font-semibold">Order Items:</span>
        <ul className="ml-4 list-disc">
          {order.items && order.items.length > 0 ? (
            order.items.map((item: OrderItemData) => ( // Use OrderItemData type
              <li key={item.id}>
                {item.productName} x {item.quantity} — ${item.price?.toFixed(2) ?? "0.00"}
              </li>
            ))
          ) : (
            <li>-</li>
          )}
        </ul>
      </div>
      {/* Status Update Modal */}
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        orderId={order.id}
        currentStatus={order.status}
        onSuccess={mutate}
      />
      {/* Delete Confirmation Modal */}
      <DeleteOrderModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        orderId={order.id}
        onSuccess={() => {
          mutate();
          // Optionally, redirect to order list after deletion
        }}
      />
    </div>
  );
}
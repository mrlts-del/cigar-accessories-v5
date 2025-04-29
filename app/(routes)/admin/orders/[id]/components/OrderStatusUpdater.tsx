// app/(routes)/admin/orders/[id]/components/OrderStatusUpdater.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Correct path using root alias
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Assuming toast hook exists

// OrderStatus enum values (copied from API)
// Removed unused ORDER_STATUSES constant as type is derived directly
type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

// Allowed status transitions (copied from API)
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"], // Assuming DELIVERED can only transition to REFUNDED
  CANCELLED: [],
  REFUNDED: [],
};

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  const possibleNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "Please select a different status.",
        variant: "default",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: selectedStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to update status (${response.status})`);
        }

        toast({
          title: "Success",
          description: `Order status updated to ${selectedStatus}.`,
          variant: "default", // Or "success" if available
        });
        setSelectedStatus(''); // Reset selection
        router.refresh(); // Refresh server component data
      } catch (error: unknown) { // Use unknown for better type safety
        console.error("Status update failed:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
          title: "Error Updating Status",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  if (possibleNextStatuses.length === 0) {
    return <p className="text-sm text-muted-foreground">No further status changes possible.</p>;
  }

  return (
    <div className="flex items-center space-x-2 pt-2">
      <Select
        value={selectedStatus}
        onValueChange={(value: string) => setSelectedStatus(value as OrderStatus)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Change status..." />
        </SelectTrigger>
        <SelectContent>
          {possibleNextStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleUpdateStatus}
        disabled={!selectedStatus || isPending || selectedStatus === currentStatus}
        size="sm"
      >
        {isPending ? 'Updating...' : 'Update Status'}
      </Button>
    </div>
  );
}
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog"; // Corrected path
import { Button } from "@/components/ui/button";
// Removed unused Input import
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast"; // Corrected path

const statusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface StatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatus: string;
  onSuccess: () => void;
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

export default function StatusUpdateModal({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  onSuccess,
}: StatusUpdateModalProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: currentStatus },
  });

  React.useEffect(() => {
    reset({ status: currentStatus });
  }, [currentStatus, open, reset]);

  const onSubmit = async (values: StatusFormValues) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: values.status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      toast({ title: "Order status updated" }); // Removed unsupported "success" variant
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) { // Use unknown for better type safety
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded px-3 py-2 w-full"
              {...register("status")}
              disabled={isSubmitting}
            >
              <option value="">Select status</option>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
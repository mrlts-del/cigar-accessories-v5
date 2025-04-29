"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog"; // Corrected path
import { Button } from "@/components/ui/button"; // This path seems correct based on other files
import { useToast } from "@/hooks/use-toast"; // Corrected path

interface DeleteOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess: () => void;
}

export default function DeleteOrderModal({
  open,
  onOpenChange,
  orderId,
  onSuccess,
}: DeleteOrderModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete order");
      }
      toast({ title: "Order deleted" }); // Removed unsupported "success" variant
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) { // Use unknown for better type safety
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Order</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          Are you sure you want to delete this order? This action cannot be undone.
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
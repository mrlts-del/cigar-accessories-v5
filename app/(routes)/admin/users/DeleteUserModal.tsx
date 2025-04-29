"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog"; // Corrected path again
import { Button } from "@/components/ui/button"; // Corrected path
import { useToast } from "@/hooks/use-toast"; // Corrected path

type DeleteUserModalProps = {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    role: string;
  };
  onSuccess: () => void;
};

export function DeleteUserModal({
  open,
  onClose,
  user,
  onSuccess,
}: DeleteUserModalProps) {
  const { toast } = useToast(); // Destructure toast
  const [loading, setLoading] = useState(false);

  const isAdmin = user.role === "ADMIN" || user.role.toUpperCase() === "ADMIN";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: result.error?.error || "Could not delete user",
          variant: "destructive",
        });
      } else {
        toast({
          title: "User deleted",
          description: "User was deleted successfully.",
          // Removed unsupported "success" variant
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) { // Use unknown and check type
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to delete <b>{user.name}</b>?
          </p>
          {isAdmin && (
            <div className="mt-2 text-red-600 text-sm font-semibold">
              Warning: Deleting an admin will remove their access to the admin dashboard.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
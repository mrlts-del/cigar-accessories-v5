"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog"; // Corrected path again
import { Button } from "@/components/ui/button"; // Corrected path
import { Input } from "@/components/ui/input"; // Corrected path
import { useToast } from "@/hooks/use-toast"; // Corrected path
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["CUSTOMER", "ADMIN"], { required_error: "Role is required" }),
});

type UserEditForm = z.infer<typeof userEditSchema>;

type UserEditModalProps = {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  currentUserRole: string;
  onSuccess: () => void;
};

export function UserEditModal({
  open,
  onClose,
  user,
  currentUserRole,
  onSuccess,
}: UserEditModalProps) {
  const { toast } = useToast(); // Destructure toast
  const [loading, setLoading] = useState(false);

  // Ensure role is always "CUSTOMER" or "ADMIN"
  const safeRole =
    user.role === "ADMIN" || user.role === "CUSTOMER"
      ? user.role
      : user.role.toUpperCase() === "ADMIN"
      ? "ADMIN"
      : "CUSTOMER";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: safeRole as "CUSTOMER" | "ADMIN",
    },
  });

  // Reset form when user changes or modal opens
  React.useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      role:
        user.role === "ADMIN" || user.role === "CUSTOMER"
          ? user.role
          : user.role.toUpperCase() === "ADMIN"
          ? "ADMIN"
          : "CUSTOMER",
    });
  }, [user, open, reset]);

  const onSubmit = async (data: UserEditForm) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Update failed",
          description: result.error?.error || "Could not update user",
          variant: "destructive",
        });
      } else {
        toast({
          title: "User updated",
          description: "User information was updated successfully.",
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

  // Only admins can change role, and cannot demote themselves if editing own user
  const canEditRole = currentUserRole === "ADMIN" && user.role !== "ADMIN_SELF";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 mt-4"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              {...register("name")}
              disabled={loading}
              defaultValue={user.name}
            />
            {errors.name && (
              <div className="text-red-600 text-xs mt-1">{errors.name.message}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={loading}
              defaultValue={user.email}
            />
            {errors.email && (
              <div className="text-red-600 text-xs mt-1">{errors.email.message}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              {...register("role")}
              disabled={!canEditRole || loading}
              className="w-full border rounded px-3 py-2"
              defaultValue={safeRole}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && (
              <div className="text-red-600 text-xs mt-1">{errors.role.message}</div>
            )}
            {!canEditRole && (
              <div className="text-xs text-gray-500 mt-1">
                Only admins can change roles. You cannot demote yourself.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
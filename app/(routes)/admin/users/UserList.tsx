"use client";

import useSWR from "swr";
import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Corrected path and added specific components
import { Button } from "@/components/ui/button"; // Corrected path
import { useToast } from "@/hooks/use-toast"; // Corrected path

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type UserListProps = {
  search: string;
  role: string;
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
        Failed to load users. Please try again.
      </div>
    );
  }
  return <>{children}</>;
}

export function UserList({ search, role }: UserListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast(); // Destructure toast

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role) params.append("role", role);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  // Removed unused mutate variable
  const { data, isLoading, error } = useSWR<{ users: User[]; total: number }>(
    `/api/users?${params.toString()}`,
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  // Placeholder action handlers
  const handleView = (user: User) => {
    // To be implemented: open user detail view
    toast({
      title: "View User",
      description: `Viewing user: ${user.name}`,
      variant: "default",
    });
  };

  const handleEdit = (user: User) => {
    // To be implemented: open edit modal
    toast({
      title: "Edit User",
      description: `Editing user: ${user.name}`,
      variant: "default",
    });
  };

  const handleDelete = (user: User) => {
    // To be implemented: open delete confirmation modal
    toast({
      title: "Delete User",
      description: `Deleting user: ${user.name}`,
      variant: "destructive",
    });
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <LoadingContent loading={isLoading} error={error}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users?.length ? (
                data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(user)}>
                        View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </LoadingContent>
    </div>
  );
}
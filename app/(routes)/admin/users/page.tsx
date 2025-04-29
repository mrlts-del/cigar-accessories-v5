"use client";

import { useState, Suspense } from "react";
import { UserList } from "./UserList";
// Removed unused Button import
import { Input } from "@/components/ui/input"; // Corrected path
// Removed unused useToast import
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  // Removed unused toast variable

  // Placeholder for filter and pagination state

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customer Management</h1>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <select
            className="border rounded px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {/* Future: Add more filters if needed */}
      </div>
      <Suspense fallback={<LoadingContent description="Loading users..." />}>
        <UserList search={search} role={role} />
      </Suspense>
    </div>
  );
}
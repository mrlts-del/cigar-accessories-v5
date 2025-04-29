'use client';

import { useState, useCallback, useMemo } from 'react'; // Added useMemo import
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

// Define the props based on the data structure from the page component
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string; // ISO string format
  image?: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

interface CustomerListProps {
  initialUsers: UserData[];
  initialPagination?: PaginationData; // Make optional
  fetchError?: boolean; // Add prop to indicate fetch error
}

// Debounce function
// Use generics for better type safety in debounce
function debounce<P extends unknown[], R>(func: (...args: P) => R, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Return a function that takes the same parameters as the original function
  return (...args: P): Promise<R> =>
    new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Call the original function after the wait time and resolve the promise
      timeoutId = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export function CustomerList({ initialUsers, initialPagination, fetchError }: CustomerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Function to update URL search parameters (Moved before conditional return)
  const updateSearchParams = useCallback((paramsToUpdate: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key); // Remove param if value is empty
      }
    });

    // Reset page to 1 when search term changes
    if (Object.prototype.hasOwnProperty.call(paramsToUpdate, 'search')) { // Use Object.prototype.hasOwnProperty.call
        current.set('page', '1');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    // Use router.push for navigation, triggering server component refetch
    router.push(`/admin/customers${query}`);
  }, [searchParams, router]);

  // Debounced version of updateSearchParams specifically for search input (Moved before conditional return)
  // Use useMemo to memoize the debounced function itself
  const debouncedUpdateSearch = useMemo(() => debounce(updateSearchParams, 500), [updateSearchParams]);


  // Display error message if fetch failed in the parent component
  if (fetchError) {
    return <p className="text-red-500 text-center py-8">Failed to load customer data.</p>;
  }

  // Provide default pagination if initial is missing (shouldn't happen if fetchError is false, but safe)
  const pagination = initialPagination ?? { page: 1, totalPages: 1, limit: 10, totalUsers: initialUsers.length };


  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedUpdateSearch({ search: newSearchTerm });
  };

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  // Use the resolved pagination object
  const { page, totalPages, limit, totalUsers } = pagination;
  const startIndex = totalUsers > 0 ? (page - 1) * limit + 1 : 0; // Handle case with 0 users
  const endIndex = totalUsers > 0 ? Math.min(page * limit, totalUsers) : 0; // Handle case with 0 users

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
         <Search className="h-4 w-4 text-muted-foreground" />
         <Input
           placeholder="Search by name or email..."
           value={searchTerm}
           onChange={handleSearchChange}
           className="max-w-sm"
         />
      </div>

      {/* Customer Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Signup Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length > 0 ? (
              initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium truncate max-w-[100px]">
                    <Link href={`/admin/customers/${user.id}`} className="hover:underline text-blue-600">
                      {user.id}
                    </Link>
                  </TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), 'PPpp')} {/* Format date */}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/customers/${user.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
           <div className="text-sm text-muted-foreground">
             Showing {startIndex} to {endIndex} of {totalUsers} customers
           </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
/// <reference types="node" />
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { cookies } from 'next/headers'; // Needed for server-side fetch authentication
import { CustomerList } from './components/CustomerList'; // Component to be created
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Define the expected shape of the API response
// Ideally, this would be shared from the API route, but defining here for clarity
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string; // Assuming ISO string format
  image?: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

interface GetUsersResponse {
  data: UserData[];
  pagination: PaginationData;
}

// Server-side data fetching function
async function getUsers(searchParams: { [key: string]: string | string[] | undefined }): Promise<GetUsersResponse | null> {
  const page = searchParams?.page || '1';
  const limit = searchParams?.limit || '10';
  const search = searchParams?.search || '';

  // Construct the URL with query parameters
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`); // Use environment variable for base URL
  url.searchParams.append('page', Array.isArray(page) ? page[0] : page);
  url.searchParams.append('limit', Array.isArray(limit) ? limit[0] : limit);
  if (search) {
    url.searchParams.append('search', Array.isArray(search) ? search[0] : search);
  }

  try {
    // Fetch data server-side, passing cookies for authentication
    const response = await fetch(url.toString(), {
      headers: {
        Cookie: cookies().toString(), // Pass cookies from the incoming request
      },
      cache: 'no-store', // Ensure fresh data for admin view
    });

    if (!response.ok) {
      // Log error details if possible
      console.error(`Error fetching users: ${response.status} ${response.statusText}`);
      try {
        const errorBody = await response.json();
        console.error('Error body:', errorBody);
      } catch { // Removed unused e variable
        // Ignore if response body is not JSON
      }
      return null; // Indicate failure
    }

    const data: GetUsersResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return null; // Indicate failure
  }
}

// The Page component (Server Component)
export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const userData = await getUsers(searchParams || {});

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Wrap the component that uses useSearchParams in Suspense */}
          <Suspense fallback={<CustomerListSkeleton />}>
            <CustomerList
              initialUsers={userData?.data ?? []} // Pass initial data or empty array
              initialPagination={userData?.pagination} // Pass initial pagination or undefined
              fetchError={!userData} // Pass a flag indicating fetch error
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton component for loading state
function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" /> {/* Search Input Skeleton */}
      </div>
      <Skeleton className="h-64 w-full" /> {/* Table Skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-8 w-1/4" /> {/* Pagination Skeleton */}
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import ProductGrid from '@/app/components/ProductGrid'; // Assuming this exists for layout
// import ProductCard from '@/app/components/ProductCard'; // Removed unused import
import { prisma } from '@/lib/prisma'; // Direct DB access for RSC
import type { Product } from '@/types/product';
import type { ProductCategory } from '@/types/product-category';
import { z } from 'zod';
import ProductFilters from '@/app/components/ProductFilters'; // Import the filters component
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import PaginationControls from '@/app/components/ui/PaginationControls'; // Import pagination
// Removed duplicate Category/Product imports

export const revalidate = 60; // Revalidate this page every 60 seconds

// Define search param schema matching the API
const searchParamsSchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().nonnegative().optional()),
  maxPrice: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().nonnegative().optional()),
  search: z.string().optional(),
  sort: z.enum([
    'createdAt_asc', 'createdAt_desc',
    'price_asc', 'price_desc',
    'name_asc', 'name_desc'
  ]).optional().default('createdAt_desc'),
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().min(1).default(1)),
  // pageSize: Let's keep pageSize fixed for now or fetch from API defaults later
});

// Define the expected props for the page component
interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Server Component to fetch and display products
async function ProductList({ searchParams }: ProductsPageProps) {
  const pageSize = 12; // Define page size

  // Validate search params
  const parsed = searchParamsSchema.safeParse(searchParams);
  if (!parsed.success) {
    // Handle invalid params - maybe show an error or default values
    console.error("Invalid search params:", parsed.error);
    // For now, proceed with default/empty filters
  }

  const {
    categoryId,
    minPrice,
    maxPrice,
    search,
    sort = 'createdAt_desc', // Default sort
    page = 1,
  } = parsed.success ? parsed.data : {};

  // Build Prisma where clause with specific type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}; // Correct initialization and typing
  if (categoryId) where.categories = { some: { id: categoryId } };
  if (minPrice !== undefined) {
    where.price = { ...(where.price), gte: minPrice };
  }
  if (maxPrice !== undefined) {
    where.price = { ...(where.price), lte: maxPrice };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build Prisma orderBy clause with specific type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  const [field, direction] = sort.split('_');
  if (['createdAt', 'price', 'name'].includes(field) && ['asc', 'desc'].includes(direction)) {
    orderBy[field] = direction;
  } else {
     orderBy.createdAt = 'desc'; // Fallback default sort
  }


  const skip = (page - 1) * pageSize;
  const limit = pageSize;

  // Fetch categories and product data concurrently
  // Adjust type annotation to match selected product and category fields
  const [products, total, categories]: [Product[], number, ProductCategory[]] = await Promise.all([
    prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            variants: true,
          },
    }),
    prisma.product.count({ where }),
    prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        bannerImageUrl: true,
        displayOrder: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  // TODO: Implement Pagination Controls
  // TODO: Implement Filter UI Component

  return (
    <div>
      {/* Wrap ProductFilters (Client Component using useSearchParams) in Suspense */}
      <Suspense fallback={<FiltersSkeleton />}>
         <ProductFilters categories={categories} />
      </Suspense>

      {/* Product Grid - Pass original products */}
      <ProductGrid
        products={products} // Pass the original products array with Decimal price
        emptyMessage="No products found matching your criteria."
      />
      {/* Removed stray closing parenthesis and ternary operator */}

      {/* Pagination Controls - Wrap in Suspense */}
      <Suspense fallback={<PaginationSkeleton />}>
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(total / pageSize)}
        />
      </Suspense>
    </div>
  );
}

// Loading Skeleton Component
function ProductListSkeleton() {
    const pageSize = 12; // Match the page size
    return (
      <div>
        {/* Skeleton for Filters */}
        <FiltersSkeleton />
        {/* Skeleton for Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
           {Array.from({ length: pageSize }).map((_, index) => (
             <div key={index} className="border rounded-lg overflow-hidden bg-card">
               <Skeleton className="h-48 w-full" />
               <div className="p-4 space-y-2">
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-6 w-1/4 mt-2" />
               </div>
             </div>
           ))}
         </div>

        {/* Skeleton for Pagination */}
        <div className="mt-8 flex justify-center items-center space-x-4">
           <Skeleton className="h-9 w-9" /> {/* Prev Button */}
           <Skeleton className="h-5 w-20" /> {/* Page x of y */}
           <Skeleton className="h-9 w-9" /> {/* Next Button */}
        </div>
      </div>
    );
}


// Skeleton for Pagination Controls
function PaginationSkeleton() {
  return (
    <div className="mt-8 flex justify-center items-center space-x-4">
      <Skeleton className="h-9 w-9" /> {/* Prev Button */}
      <Skeleton className="h-5 w-20" /> {/* Page x of y */}
      <Skeleton className="h-9 w-9" /> {/* Next Button */}
    </div>
  );
}

// Separate Skeleton for Filters
function FiltersSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end p-4 border rounded-lg bg-card">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-1">
          <Skeleton className="h-4 w-16 mb-1" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input/Select */}
        </div>
      ))}
    </div>
  );
}

// Main Page Component
export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Our Products</h1>
      <Suspense fallback={<ProductListSkeleton />}>
        {/* Async Server Component */}
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
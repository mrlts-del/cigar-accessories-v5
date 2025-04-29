"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react'; // No need for Suspense here anymore
import Container from "@/components/ui/container";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Assuming Product type includes media based on backend changes
interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
}
interface ProductCategory {
    id: string;
    name: string;
}

// Interface matching the data structure returned by the API
interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  media: ProductMedia[];
  categories: ProductCategory[];
  createdAt: string; // Or Date
}

// Interface matching the props expected by ProductCard
interface ProductCardData {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    discount?: string;
}


interface GetProductsResponse {
  products: ApiProduct[];
  totalCount: number;
}

// --- Helper to transform ApiProduct to ProductCardData ---
const transformProductForCard = (apiProduct: ApiProduct): ProductCardData => {
  const displayPrice = apiProduct.salePrice ?? apiProduct.price;
  const originalPrice = apiProduct.salePrice ? apiProduct.price : undefined;
  const discount = originalPrice && displayPrice < originalPrice
    ? `${Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% off`
    : undefined;

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    price: displayPrice,
    originalPrice: originalPrice,
    imageUrl: apiProduct.media?.[0]?.url || '/placeholder.png',
    discount: discount,
  };
};


const CollectionClientContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook is now inside the client component

  // Initialize state from searchParams
  const [categoryId, setCategoryId] = useState<string | undefined>(searchParams.get('categoryId') || undefined);
  const [minPrice, setMinPrice] = useState<string | undefined>(searchParams.get('minPrice') || undefined);
  const [maxPrice, setMaxPrice] = useState<string | undefined>(searchParams.get('maxPrice') || undefined);
  const [onSale, setOnSale] = useState<boolean>(searchParams.get('onSale') === 'true');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get('sortOrder') || 'desc');
  const [search, setSearch] = useState<string | undefined>(searchParams.get('search') || undefined);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [displayedProducts, setDisplayedProducts] = useState<ApiProduct[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  // Function to build API URL
  const buildApiUrl = useCallback((currentPage: number) => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });
    if (categoryId) params.set('categoryId', categoryId);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (onSale) params.set('onSale', 'true');
    if (search) params.set('search', search);
    return `${process.env.NEXT_PUBLIC_API_URL}/api/products?${params.toString()}`;
  }, [categoryId, minPrice, maxPrice, onSale, sortBy, sortOrder, limit, search]);


  // Function to fetch products
  const fetchProducts = useCallback(async (fetchPage: number, isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setIsLoadingInitial(true);
      setDisplayedProducts([]);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const url = buildApiUrl(fetchPage);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GetProductsResponse = await response.json();

      setTotalCount(data.totalCount || 0);
      const fetchedProducts = data.products || [];

      if (fetchPage === 1) {
        setDisplayedProducts(fetchedProducts);
      } else {
        setDisplayedProducts(prev => [...prev, ...fetchedProducts]);
      }

      setHasMore((fetchPage * limit) < (data.totalCount || 0));

    } catch (err: unknown) {
      console.error("Failed to fetch products:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load products.");
      }
      setHasMore(false);
    } finally {
      if (isInitialLoad) {
        setIsLoadingInitial(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [buildApiUrl, limit]);


  // Effect to update search state if URL changes externally
  useEffect(() => {
    setSearch(searchParams.get('search') || undefined);
  }, [searchParams]);

  // Initial fetch and fetch on filter/sort/search changes
  useEffect(() => {
    fetchProducts(1, true);
  }, [categoryId, minPrice, maxPrice, onSale, sortBy, sortOrder, search, fetchProducts]);


  // Update URL query params when filters change (excluding page and search)
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (onSale) params.set('onSale', 'true');
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    // Only push filter/sort changes, not search (driven by Navbar) or page (handled by loadMore)
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  }, [categoryId, minPrice, maxPrice, onSale, sortBy, sortOrder, router]);


  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };


  // --- Render Logic ---
  const renderSkeletons = () => (
    Array.from({ length: limit }).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    ))
  );

  return (
    <>
      <Container>
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 py-4">
          Category 1 / Category 2 / Category 3 / Category 4 / Category 5
        </div>

        {/* Page Title, Description, Banner */}
        <h1 className="text-3xl font-bold mb-4">Shop All Collections</h1>
        <p className="text-gray-700 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p className="text-gray-700 mb-4">
          Discover our bestsellers and find your next favorite.
        </p>
        <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">
          Transform your cigar collection with our premium accessories.
        </div>

        {/* Main content area */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filtering Sidebar (Desktop) */}
          <div className="w-64 flex-shrink-0 hidden md:block">
            <div className="border-r pr-8">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Category</h4>
                <ul>
                  <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category1')}>Placeholder Category 1</li>
                  <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category2')}>Placeholder Category 2</li>
                  <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category3')}>Placeholder Category 3</li>
                  <li className="mb-1 cursor-pointer" onClick={() => setCategoryId(undefined)}>All Categories</li>
                </ul>
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-2">Price range</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice || ''}
                    onChange={(e) => setMinPrice(e.target.value || undefined)}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value || undefined)}
                    className="w-1/2"
                  />
                </div>
              </div>
              <div className="mb-6 flex items-center space-x-2">
                <Checkbox id="onSale" checked={onSale} onCheckedChange={(checked) => setOnSale(!!checked)} />
                <Label htmlFor="onSale">Sale/Discount items</Label>
              </div>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Filters</h3>
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Category</h4>
                    <ul>
                      <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category1')}>Placeholder Category 1</li>
                      <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category2')}>Placeholder Category 2</li>
                      <li className="mb-1 cursor-pointer" onClick={() => setCategoryId('category3')}>Placeholder Category 3</li>
                      <li className="mb-1 cursor-pointer" onClick={() => setCategoryId(undefined)}>All Categories</li>
                    </ul>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Price range</h4>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice || ''}
                        onChange={(e) => setMinPrice(e.target.value || undefined)}
                        className="w-1/2"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice || ''}
                        onChange={(e) => setMaxPrice(e.target.value || undefined)}
                        className="w-1/2"
                      />
                    </div>
                  </div>
                  <div className="mb-6 flex items-center space-x-2">
                    <Checkbox id="onSaleMobile" checked={onSale} onCheckedChange={(checked) => setOnSale(!!checked)} />
                    <Label htmlFor="onSaleMobile">Sale/Discount items</Label>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>


          {/* Product Listing Area */}
          <div className="flex-1">
            {/* Sorting Controls and Product Count */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-600">
                Showing {displayedProducts.length} of {totalCount} products
              </div>
              <div>
                <label htmlFor="sort" className="mr-2 text-sm text-gray-600">Sort by:</label>
                <Select onValueChange={(value) => {
                  const [by, order] = value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }} value={`${sortBy}-${sortOrder}`}>
                  <SelectTrigger id="sort" className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low-High</SelectItem>
                    <SelectItem value="price-desc">Price: High-Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Active Search Term */}
            {search && (
              <div className="mb-4 text-lg">
                Showing results for: <span className="font-semibold">&quot;{search}&quot;</span>
                <Button variant="link" className="ml-2 p-0 h-auto text-blue-600" onClick={() => router.push('/collection')}>
                  Clear Search
                </Button>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingInitial && displayedProducts.length === 0 ? (
                renderSkeletons()
              ) : error ? (
                <div className="col-span-full text-red-600">Error: {error}</div>
              ) : displayedProducts.length > 0 ? (
                 displayedProducts.map(apiProduct => {
                   const cardData = transformProductForCard(apiProduct);
                   return <ProductCard key={cardData.id} product={cardData} />;
                 })
              ) : (
                 !isLoadingInitial && <div className="col-span-full text-center text-gray-500">No products found matching your criteria.</div>
              )}
              {isLoadingMore && renderSkeletons()}
            </div>


            {/* Load More Button */}
            <div className="flex justify-center mt-8">
              {hasMore && (
                <Button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore || isLoadingInitial}
                  variant="outline"
                  size="lg"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Products"
                  )}
                </Button>
              )}
              {!hasMore && displayedProducts.length > 0 && (
                 <p className="text-gray-500">You&apos;ve reached the end.</p>
              )}
            </div>


            {/* Cross-Selling Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {displayedProducts.slice(0, 5).map(apiProduct => {
                    const cardData = transformProductForCard(apiProduct);
                    return (
                      <div key={`cross-${cardData.id}`} className="flex-shrink-0 w-64">
                        <ProductCard product={cardData} />
                      </div>
                    );
                })}
                 {displayedProducts.length === 0 && !isLoadingInitial && !error && (
                    <p className="text-gray-500">No recommendations available yet.</p>
                 )}
               </div>
             </div>
           </div>
         </div>
     </Container>
     </>
   );
 }

export default CollectionClientContent;
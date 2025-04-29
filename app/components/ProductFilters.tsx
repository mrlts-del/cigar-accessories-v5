"use client";

import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input"; // Use components/ui path
import { Label } from "@/components/ui/label"; // Use components/ui path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Define the expected shape for category data (only id and name needed)
type SelectedCategory = {
  id: string;
  name: string;
};

interface ProductFiltersProps {
  categories: SelectedCategory[]; // Use the selected category type
  // No initial values needed, read directly from searchParams
}

const sortOptions = [
  { value: 'createdAt_desc', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current values from URL or set defaults
  const currentCategory = searchParams.get('categoryId') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSort = searchParams.get('sort') || 'createdAt_desc';

  // Function to update URL search parameters
  const updateSearchParams = useCallback(
    (paramsToUpdate: { [key: string]: string | null }) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      // Reset page to 1 when filters change
      current.set('page', '1');

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false }); // Prevent scroll jump
    },
    [searchParams, pathname, router]
  );

  // Handlers for individual controls
  const handleCategoryChange = (value: string) => {
    updateSearchParams({ categoryId: value });
  };

  const handleSortChange = (value: string) => {
    updateSearchParams({ sort: value });
  };

  // Use onBlur for price/search inputs to avoid excessive updates while typing
  const handleSearchBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    updateSearchParams({ search: event.target.value });
  };

  const handleMinPriceBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    updateSearchParams({ minPrice: event.target.value });
  };

  const handleMaxPriceBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    updateSearchParams({ maxPrice: event.target.value });
  };


  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end p-4 border rounded-lg bg-card text-card-foreground">
      {/* Search Input */}
      <div className="space-y-1">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Product name..."
          defaultValue={currentSearch}
          onBlur={handleSearchBlur}
          // Add key to reset input if defaultValue changes externally (though unlikely here)
          key={`search-${currentSearch}`}
        />
      </div>

      {/* Category Select */}
      <div className="space-y-1">
        <Label htmlFor="category">Category</Label>
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger id="category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Price Input */}
      <div className="space-y-1">
        <Label htmlFor="minPrice">Min Price</Label>
        <Input
          id="minPrice"
          type="number"
          placeholder="0"
          min="0"
          defaultValue={currentMinPrice}
          onBlur={handleMinPriceBlur}
          key={`minPrice-${currentMinPrice}`}
        />
      </div>

      {/* Max Price Input */}
      <div className="space-y-1">
        <Label htmlFor="maxPrice">Max Price</Label>
        <Input
          id="maxPrice"
          type="number"
          placeholder="Any"
          min="0"
          defaultValue={currentMaxPrice}
          onBlur={handleMaxPriceBlur}
          key={`maxPrice-${currentMaxPrice}`}
        />
      </div>

      {/* Sort Select */}
      <div className="space-y-1">
        <Label htmlFor="sort">Sort By</Label>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger id="sort">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
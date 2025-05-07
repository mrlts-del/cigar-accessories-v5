// app/(routes)/products/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import Container from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';

interface ProductsPageProps {
  searchParams: Promise<{
    categorySlug?: string;
    color?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { categorySlug, color, size, minPrice, maxPrice, sort } = await searchParams;

  // Fetch products based on filters
  const products = await getProducts(categorySlug, color, size, minPrice, maxPrice, sort);

  if (!products || products.length === 0) {
    notFound();
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-4">Products</h1>
        <Separator className="mb-6" />
        <Suspense fallback={<div>Loading...</div>}>
          <ProductGrid products={products} />
        </Suspense>
      </div>
    </Container>
  );
}

async function getProducts(
  categorySlug?: string,
  color?: string,
  size?: string,
  minPrice?: string,
  maxPrice?: string,
  sort?: string
) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
    if (categorySlug) url.searchParams.set('categorySlug', categorySlug);
    if (color) url.searchParams.set('color', color);
    if (size) url.searchParams.set('size', size);
    if (minPrice) url.searchParams.set('minPrice', minPrice);
    if (maxPrice) url.searchParams.set('maxPrice', maxPrice);
    if (sort) url.searchParams.set('sort', sort);

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Error fetching products: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}
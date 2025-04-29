"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm"; // Corrected path
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <Suspense fallback={<LoadingContent description="Loading product form..." />}>
        <ProductForm onSuccess={() => router.push("/admin/products")} />
      </Suspense>
    </div>
  );
}
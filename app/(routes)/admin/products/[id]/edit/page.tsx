"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProductForm from "@/app/components/ProductForm"; // Corrected path

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto py-8">Loading...</div>;
  if (isError || !data) return <div className="container mx-auto py-8 text-red-500">Failed to load product.</div>;

  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm
        initialData={data}
        onSuccess={() => router.push("/admin/products")}
      />
    </div>
  );
}
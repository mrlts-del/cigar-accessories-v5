"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input"; // Added Input
import { useToast } from "hooks/use-toast";
import Image from "next/image";
import { Variant } from "@prisma/client"; // Added Variant type
const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  image: z
    .any()
    .refine((file) => file instanceof File, "Image is required")
    .refine(
      (file) =>
        !file ||
        (["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
          file.size <= 5 * 1024 * 1024),
      "Image must be jpg, png, or webp and ≤ 5MB"
    ),
});

// Define a type for the variant state including the editable inventory
type EditableVariant = Variant & { editableInventory: string };

type ProductFormProps = {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    price: number; // Keep base price for simplicity or adjust logic if needed
    imagePath?: string; // Use imagePath for local storage
    variants?: Variant[]; // Add variants to initial data
  };
  onSuccess?: () => void;
};
export default function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "", // Keep base price field for now
    image: null as File | null,
  });
  const [variants, setVariants] = useState<EditableVariant[]>(
    initialData?.variants?.map(v => ({ ...v, editableInventory: v.inventory.toString() })) || []
  );
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imagePath || "");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setUploading(true);
      const res = await fetch(
        initialData?.id ? `/api/products/${initialData.id}` : "/api/products",
        {
          method: initialData?.id ? "PUT" : "POST",
          body: data,
        }
      );
      setUploading(false);
      if (!res.ok) throw new Error("Failed to save product");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: `Product ${initialData?.id ? "updated" : "created"}!`, variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => { // Use unknown for error
      // Type check before accessing message
      const message = err instanceof Error ? err.message : "Failed to save product";
      toast({ title: message, variant: "destructive" });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, files } = e.target as HTMLInputElement; // Use HTMLInputElement for files
    if (name === "image" && files && files[0]) {
      setForm((f) => ({ ...f, image: files[0] }));
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  // Handler for variant inventory changes
  function handleVariantInventoryChange(index: number, value: string) {
    // Allow only numbers and prevent negative values visually (server validates too)
    const numericValue = value.replace(/[^0-9]/g, '');
    setVariants(currentVariants => {
      const updatedVariants = [...currentVariants];
      updatedVariants[index] = { ...updatedVariants[index], editableInventory: numericValue };
      return updatedVariants;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const result = productSchema.safeParse({ ...form, price: Number(form.price) });
    if (!result.success) {
      const fieldErrors: { [k: string]: string } = {};
      for (const err of result.error.errors) {
        fieldErrors[err.path[0]] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const data = new FormData();
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("price", form.price); // Keep sending base price if needed by API
    if (form.image) data.append("image", form.image);

    // Add variants data as a JSON string
    const variantsToSubmit = variants.map(v => ({
        id: v.id,
        inventory: parseInt(v.editableInventory, 10) || 0 // Ensure it's a number, default to 0
    }));
    data.append("variants", JSON.stringify(variantsToSubmit));

    mutation.mutate(data);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          name="name"
          className="input input-bordered w-full"
          value={form.name}
          onChange={handleChange}
          disabled={uploading}
        />
        {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
      </div>
      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          name="description"
          className="input input-bordered w-full"
          value={form.description}
          onChange={handleChange}
          disabled={uploading}
        />
        {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
      </div>
      <div>
        <label className="block font-medium mb-1">Price</label>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          className="input input-bordered w-full"
          value={form.price}
          onChange={handleChange}
          disabled={uploading}
        />
        {errors.price && <div className="text-red-500 text-sm">{errors.price}</div>}
      </div>
      <div>
        <label className="block font-medium mb-1">Image</label>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="file-input file-input-bordered w-full"
          onChange={handleChange}
          ref={fileInputRef}
          disabled={uploading}
        />
        {errors.image && <div className="text-red-500 text-sm">{errors.image}</div>}
        {imagePreview && (
          <div className="mt-2">
            <Image
              src={imagePreview}
              alt="Preview"
              width={128}
              height={128}
              className="object-cover rounded"
            />
          </div>
        )}
      </div>

      {/* Variants Section */}
      {variants.length > 0 && (
        <div className="space-y-4 border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Variants Inventory</h3>
          {variants.map((variant, index) => (
            <div key={variant.id} className="flex items-center gap-4 border-b pb-2 last:border-b-0">
              <div className="flex-1">
                <span className="font-semibold">
                  {variant.size || ""} {variant.color || ""} {variant.sku ? `(${variant.sku})` : ""}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  Current: {variant.inventory}
                </span>
              </div>
              <div className="w-24">
                 <label htmlFor={`variant-inventory-${index}`} className="sr-only">Inventory for {variant.sku}</label>
                 <Input
                   id={`variant-inventory-${index}`}
                   type="number"
                   min="0"
                   value={variant.editableInventory}
                   onChange={(e) => handleVariantInventoryChange(index, e.target.value)}
                   className="input input-bordered input-sm w-full"
                   disabled={uploading || mutation.isLoading}
                 />
              </div>
            </div>
          ))}
          {/* Add validation errors for variants if needed */}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading || mutation.isLoading}>
          {uploading || mutation.isLoading
            ? initialData?.id
              ? "Updating..."
              : "Creating..."
            : initialData?.id
            ? "Update Product"
            : "Create Product"}
        </Button>
        {initialData && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm({
                name: initialData.name,
                description: initialData.description,
                price: initialData.price.toString(), // Reset base price
                image: null,
              });
              // Reset variants state
              setVariants(initialData.variants?.map(v => ({ ...v, editableInventory: v.inventory.toString() })) || []);
              setImagePreview(initialData.imagePath || ""); // Reset image preview using imagePath
              setErrors({});
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={uploading}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  );
}
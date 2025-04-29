"use client";

import Link from "next/link";
import { Card } from "./ui/card";
import Image from "next/image"; // Import next/image
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal

type Product = {
  id: string;
  name: string;
  price: Decimal; // Change price type to Decimal
  imagePath: string | null; // Use imagePath and allow null
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} passHref>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative w-full aspect-square bg-gray-100 rounded-t-md overflow-hidden">
          {product.imagePath ? (
            <Image
              src={product.imagePath}
              alt={product.name}
              fill // Use fill to cover the container
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes, adjust as needed
              className="object-cover" // Apply necessary styling
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1 flex flex col justify-between p-4">
          <div>
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
          </div>
          <div className="mt-2 font-bold text-primary text-xl">
            ${product.price.toFixed(2)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
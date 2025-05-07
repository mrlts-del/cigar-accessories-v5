import React from 'react';
import ProductCard from './ProductCard';
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// Define a more complete Product interface matching the data structure
interface Product {
  id: string;
  name: string;
  price: Decimal; // Use Decimal type from Prisma
  imagePath?: string | null; // Match Prisma schema (optional string or null)
  // Add other relevant product properties if needed
  salePrice?: Decimal | null;
  tags?: string[];
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        // Map the Product data to the structure expected by ProductCard
        <ProductCard
          key={product.id}
          product={{
            id: product.id,
            name: product.name,
            price: product.price.toNumber(), // Convert Decimal to number
            imageUrl: product.imagePath || '/placeholder.png', // Use imagePath or a placeholder
            originalPrice: product.salePrice ? product.price.toNumber() : undefined, // Logic for original price if salePrice exists
            // discount: calculateDiscount(product.price, product.salePrice), // Example: Calculate discount if needed
          }}
        />
      ))}
    </div>
  );
};

export default ProductGrid;

// Helper function example (optional)
// function calculateDiscount(original: Decimal, sale?: Decimal | null): string | undefined {
//   if (sale && original.greaterThan(sale)) {
//     const discount = original.minus(sale).dividedBy(original).times(100);
//     return `${discount.toFixed(0)}% off`;
//   }
//   return undefined;
// }
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma is exported as a named export
import { withError } from "@/lib/withError"; // Assuming withError is exported as a named export
// Define interfaces for related models (assuming structure)
interface ProductMedia {
  id: string;
  url: string;
  altText?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Define a more specific type for the product including relations
interface ProductWithDetails {
  id: string;
  name: string;
  description: string | null;
  price: number; // Assuming price is a number, adjust if Decimal
  sku: string | null;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
  // Add other Product fields as needed based on schema
  media: ProductMedia[];
  categories: Category[];
}

// Define response type using the specific interface
export type GetProductResponse = {
  product: ProductWithDetails | null;
};

export const GET = withError(
  async (
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const { id } = params;

    // Fetch single product by ID
    const productQueryResult = await prisma.product.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        media: true,
        categories: true,
        variants: {
          select: {
            sku: true,
            inventory: true,
          },
          take: 1,
        },
      },
    });

    let product: ProductWithDetails | null = null;

    if (productQueryResult) {
      product = {
        id: productQueryResult.id,
        name: productQueryResult.name,
        description: productQueryResult.description,
        price: productQueryResult.price.toNumber(), // Convert Decimal to number
        sku: productQueryResult.variants.length > 0 ? productQueryResult.variants[0].sku : null,
        stock: productQueryResult.variants.length > 0 ? productQueryResult.variants[0].inventory : 0,
        createdAt: productQueryResult.createdAt,
        updatedAt: productQueryResult.updatedAt,
        media: productQueryResult.media,
        categories: productQueryResult.categories,
      };
    }

    // Return response
    const result: GetProductResponse = { product };
    return NextResponse.json(result);
  }
);
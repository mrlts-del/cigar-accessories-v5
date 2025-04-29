export const dynamic = 'force-dynamic'; // Mark the route as dynamic
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma is exported as a named export
import { withError } from "@/lib/withError"; // Assuming withError is exported as a named export
// Define response type
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
export type GetProductsResponse = {
  products: ProductWithDetails[];
  totalCount: number;
};

type ProductWhereClause = {
  onSale?: boolean; // Keep for now, might be redundant
  price?: {
    gte?: number;
    lte?: number;
  };
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
  categories?: { // Added categories
    some?: {
      id?: string;
    };
  };
  salePrice?: { // Added salePrice
    not?: null;
  };
};

type ProductOrderByClause = {
  price?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
};
import { NextRequest } from "next/server";

export const GET = withError(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // Pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10
  const skip = (page - 1) * limit;

  const categoryId = searchParams.get('categoryId');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const onSale = searchParams.get('onSale');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');
  const search = searchParams.get('search'); // <-- Add search param

  const where: ProductWhereClause = {};

  // Add search condition
  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      // Add other fields to search here if needed, e.g., tags
    ];
  }

  // Existing filters
  if (categoryId) {
    where.categories = {
      some: {
        id: categoryId,
      },
    };
  }
  if (minPrice) {
    where.price = {
      ...where.price,
      gte: parseFloat(minPrice),
    };
  }
  if (maxPrice) {
    where.price = {
      ...where.price,
      lte: parseFloat(maxPrice),
    };
  }
  if (onSale === 'true') {
    where.salePrice = {
      not: null,
    };
  }

  const orderBy: ProductOrderByClause = {};
  if (sortBy === 'price') {
    orderBy.price = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    // Default to 'Newest' or 'Featured' (using createdAt desc)
    orderBy.createdAt = 'desc';
  }


  // Fetch total count and paginated products in parallel
  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
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
      orderBy,
      skip: skip,
      take: limit,
    })
  ]);

  // Map the query result to ProductWithDetails type
  const productsWithDetails: ProductWithDetails[] = products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.toNumber(), // Convert Decimal to number
    sku: product.variants.length > 0 ? product.variants[0].sku : null,
    stock: product.variants.length > 0 ? product.variants[0].inventory : 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    media: product.media,
    categories: product.categories,
  }));


  const result: GetProductsResponse = { products: productsWithDetails, totalCount };
  return NextResponse.json(result);
});
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";

export const revalidate = 60; // Revalidate featured products data every 60 seconds

export type GetFeaturedProductsResponse = {
  products: Product[]; // Use Product type
};

export const GET = async () => {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 8,
    include: {
      variants: true,
    },
  });
  const result: GetFeaturedProductsResponse = { products };
  return NextResponse.json(result);
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@prisma/client"; // Import Product type

export const revalidate = 60; // Revalidate featured products data every 60 seconds

export type GetFeaturedProductsResponse = {
  products: Product[]; // Use Product type
};

export const GET = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const result: GetFeaturedProductsResponse = { products };
  return NextResponse.json(result);
}
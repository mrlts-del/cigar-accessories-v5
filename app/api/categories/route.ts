import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import type { ProductCategory } from "@/types/product-category";

export const revalidate = 3600; // Revalidate category data every hour

type GetCategoriesResponse = Pick<ProductCategory, 'id' | 'name' | 'slug'>[];


export const GET = withError(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
  const result: GetCategoriesResponse = categories;
  return NextResponse.json(result);
});
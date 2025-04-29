import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import { Category } from "@prisma/client"; // Import Category type

export const revalidate = 3600; // Revalidate category data every hour

export type GetCategoriesResponse = {
  categories: Category[]; // Use Category type
};

export const GET = withError(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  const result: GetCategoriesResponse = { categories };
  return NextResponse.json(result);
});
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import { Category } from "@prisma/client"; // Import Category type

// Define response type based on Category model
export type GetBlogCategoriesResponse = Pick<Category, 'id' | 'name'>[];

/**
 * @swagger
 * /api/blog/categories:
 *   get:
 *     summary: Get all blog categories
 *     tags: [Blog]
 *     description: Retrieves a list of all blog categories.
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: cuid
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
export const GET = withError(async () => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      // slug: true, // Removed to fix TypeScript error
    },
    orderBy: {
      name: 'asc',
    }
  });

  // Explicitly type the result to ensure it matches the defined response type
  // Explicitly cast the result as Prisma's inferred type seems incorrect
  const result: GetBlogCategoriesResponse = categories as GetBlogCategoriesResponse;

  return NextResponse.json(result);
});
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

// Define response structure interfaces locally
interface RelatedCategoryInfo {
  id: string;
  name: string;
  slug: string;
}

interface RelatedBlogPost {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl: string | null;
  excerpt: string | null;
  categories: RelatedCategoryInfo[];
}

export type GetRelatedBlogPostsResponse = RelatedBlogPost[];

/**
 * @swagger
 * /api/blog/posts/{slug}/related:
 *   get:
 *     summary: Get related blog posts
 *     tags: [Blog]
 *     description: Retrieves a list of related blog posts based on shared categories.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique slug of the blog post to find related posts for.
 *     responses:
 *       200:
 *         description: A list of related blog posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RelatedBlogPost'
 *       404:
 *         description: Original blog post not found.
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     RelatedCategoryInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *     RelatedBlogPost:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         featuredImageUrl:
 *           type: string
 *           nullable: true
 *         excerpt:
 *           type: string
 *           nullable: true
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RelatedCategoryInfo'
 */
interface RouteParams {
  params: { slug: string };
}

export const GET = withError(async (request: Request, { params }: RouteParams) => {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
  }

  // 1. Find the original post to get its categories
  const originalPost = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      id: true,
      categories: {
        select: {
          id: true, // Get category IDs
        },
      },
    },
  });

  if (!originalPost) {
    return NextResponse.json({ error: "Original blog post not found" }, { status: 404 });
  }

  const categoryIds = originalPost.categories.map((cat: { id: string }) => cat.id);

  if (categoryIds.length === 0) {
    // No categories to find related posts by, return empty array
    return NextResponse.json([]);
  }

  // 2. Find related posts (published, in the same categories, not the original post)
  const relatedPostsData = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      id: {
        not: originalPost.id, // Exclude the original post
      },
      categories: {
        some: {
          id: {
            in: categoryIds, // In any of the original post's categories
          },
        },
      },
    },
    take: 4, // Limit to 3-4 related posts
    orderBy: {
      publishedAt: 'desc', // Or another relevant sorting criteria like relevance (more complex)
    },
    select: {
      id: true,
      title: true,
      slug: true,
      featuredImageUrl: true,
      excerpt: true,
      categories: { // Include categories to show why they are related
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

   // Map to the response structure
   const result: GetRelatedBlogPostsResponse = relatedPostsData.map((post: RelatedBlogPost) => ({
       id: post.id,
       title: post.title,
       slug: post.slug,
       featuredImageUrl: post.featuredImageUrl,
       excerpt: post.excerpt,
       categories: post.categories, // categories is already selected in the desired shape
   }));


  return NextResponse.json(result);
});
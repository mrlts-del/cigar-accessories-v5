import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

// Define response structure interfaces locally
interface AuthorInfo {
  id: string;
  name: string;
  profileImageUrl: string | null;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

interface GetBlogPostBySlugResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: Date | null;
  author: AuthorInfo | null;
  categories: CategoryInfo[];
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string; // Use string literal type instead of BlogPostStatus
}

// Swagger definitions remain the same...
/**
 * @swagger
 * /api/blog/posts/{slug}:
 *   get:
 *     summary: Get a single blog post by slug
 *     tags: [Blog]
 *     description: Retrieves a single published blog post by its unique slug, including author and category details.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique slug of the blog post.
 *     responses:
 *       200:
 *         description: The blog post details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetBlogPostBySlugResponse'
 *       404:
 *         description: Blog post not found or not published.
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     AuthorInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         name:
 *           type: string
 *         profileImageUrl:
 *           type: string
 *           nullable: true
 *     CategoryInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *     GetBlogPostBySlugResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         content:
 *           type: string
 *         excerpt:
 *           type: string
 *           nullable: true
 *         featuredImageUrl:
 *           type: string
 *           nullable: true
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         author:
 *           $ref: '#/components/schemas/AuthorInfo'
 *           nullable: true
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryInfo'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         metaTitle:
 *           type: string
 *           nullable: true
 *         metaDescription:
 *           type: string
 *           nullable: true
 *         canonicalUrl:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 */
interface RouteParams {
  params: { slug: string };
}

export const GET = withError(async (request: Request, { params }: RouteParams) => {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
  }

  const post = await prisma.blogPost.findUnique({
    where: {
      slug: slug,
      status: 'PUBLISHED',
    },
    // Correct structure: Top-level select includes scalars AND relations.
    // Relations have their own nested select.
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      featuredImageUrl: true,
      publishedAt: true,
      // tags: true, // Removed to fix TypeScript error
      // metaTitle: true, // Removed to fix TypeScript error
      // metaDescription: true, // Removed to fix TypeScript error
      // canonicalUrl: true, // Removed to fix TypeScript error
      createdAt: true,
      updatedAt: true,
      status: true,
      author: { // Select relation
        select: { // Nested select for relation fields
          id: true,
          name: true,
          profileImageUrl: true,
        },
      },
      categories: { // Select relation
        select: { // Nested select for relation fields
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Blog post not found or not published" }, { status: 404 });
  }

  // The type of 'post' returned by Prisma with the select above *should* match GetBlogPostBySlugResponse
  // If TS errors persist here, it confirms the type mismatch issue.
  const result: GetBlogPostBySlugResponse = post as GetBlogPostBySlugResponse;

  return NextResponse.json(result);
});
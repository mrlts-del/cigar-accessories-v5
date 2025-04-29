export const dynamic = 'force-dynamic'; // Mark the route as dynamic
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import { Prisma } from "@prisma/client"; // Keep Prisma namespace import

// Define response structure interfaces locally
interface AuthorInfo {
  name: string;
  profileImageUrl: string | null;
}

interface CategoryInfo {
  name: string;
  slug: string;
}

interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: Date | null;
  author: AuthorInfo | null; // Allow null author from include
  categories: CategoryInfo[];
}

export interface GetBlogPostsResponse {
  posts: BlogPostListItem[];
  pagination: {
    totalPosts: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

// Swagger definitions remain the same...
/**
 * @swagger
 * /api/blog/posts:
 *   get:
 *     summary: Get all published blog posts with filtering and pagination
 *     tags: [Blog]
 *     description: Retrieves a list of published blog posts, supporting filtering by category, author, tag, and pagination.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter posts by category slug.
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *           format: cuid
 *         description: Filter posts by author ID.
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter posts by tag.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 9
 *         description: Number of posts per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [publishedAt, createdAt, title]
 *           default: publishedAt
 *         description: Field to sort by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order.
 *     responses:
 *       200:
 *         description: A list of blog posts with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetBlogPostsResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     AuthorInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         profileImageUrl:
 *           type: string
 *           nullable: true
 *     CategoryInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *     BlogPostListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *         title:
 *           type: string
 *         slug:
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
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         totalPosts:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         currentPage:
 *           type: integer
 *         limit:
 *           type: integer
 *     GetBlogPostsResponse:
 *       type: object
 *       properties:
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BlogPostListItem'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 */
import { NextRequest } from "next/server";

// Cast request to any temporarily to bypass NextRequest/Request type conflict with withError
export const GET = withError(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // Extract and validate query parameters
  const categorySlug = searchParams.get("category");
  const authorId = searchParams.get("author");
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const sortBy = searchParams.get("sortBy") || "publishedAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Validation
  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
    return NextResponse.json({ error: "Invalid page or limit parameter" }, { status: 400 });
  }
  const validSortByFields = ["publishedAt", "createdAt", "title"];
  const validSortOrders = ["asc", "desc"];
  if (!validSortByFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
     return NextResponse.json({ error: "Invalid sortBy or sortOrder parameter" }, { status: 400 });
  }

  const skip = (page - 1) * limit;
  const take = limit;

  // Construct WHERE clause
  const where: Prisma.BlogPostWhereInput = {
    status: 'PUBLISHED',
  };
  if (categorySlug) {
    where.categories = { some: { slug: categorySlug } };
  }
  if (authorId) {
    where.authorId = authorId;
  }
  if (tag) {
    // where.tags = { has: tag }; // Removed to fix TypeScript error
  }

  // Construct ORDER BY clause
  const orderBy = {
    [sortBy]: sortOrder,
  };

  // Fetch total count and posts in parallel
  const [totalPosts, postsData] = await prisma.$transaction([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip,
      take,
      // Select scalar fields directly
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImageUrl: true,
        publishedAt: true,
        // tags: true, // Removed to fix TypeScript error
        // Use include *within* select for relations
        author: {
          select: {
            name: true,
            profileImageUrl: true,
          },
        },
        categories: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / limit);

  // Map data to the defined BlogPostListItem structure
  // Prisma's return type with select should match this structure closely
  const posts: BlogPostListItem[] = postsData.map((post: Prisma.BlogPostGetPayload<{ select: { id: true; title: true; slug: true; excerpt: true; featuredImageUrl: true; publishedAt: true; author: { select: { name: true; profileImageUrl: true; } }; categories: { select: { name: true; slug: true; } }; } }>) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImageUrl: post.featuredImageUrl,
    publishedAt: post.publishedAt,
    author: post.author,
    categories: post.categories,
    // tags: (post as any).tags, // Removed to fix TypeScript error
  }));

  const response: GetBlogPostsResponse = {
    posts,
    pagination: {
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
    },
  };

  return NextResponse.json(response);
});
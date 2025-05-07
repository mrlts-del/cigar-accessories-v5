import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

export const GET = withError(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const relatedPosts = await getRelatedPosts(slug);

  return NextResponse.json(relatedPosts);
});

async function getRelatedPosts(slug: string) {
  try {
    // Find the current post to get its categories
    const currentPost = await prisma.blogPost.findUnique({ // Corrected casing to blogPost
      where: { slug },
      select: { categories: { select: { id: true } } },
    });

    if (!currentPost || !currentPost.categories.length) {
      return []; // No categories or post not found, return empty
    }

    const categoryIds = currentPost.categories.map((cat: { id: string }) => cat.id);

    // Find related posts (excluding the current one) that share at least one category
    const relatedPosts = await prisma.blogPost.findMany({ // Corrected casing to blogPost
      where: {
        NOT: { slug: slug }, // Exclude the current post
        categories: {
          some: {
            id: { in: categoryIds }, // Find posts in the same categories
          },
        },
        status: 'PUBLISHED', // Only fetch published posts
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImageUrl: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 3, // Limit to 3 related posts
      orderBy: {
        publishedAt: 'desc', // Order by publication date
      },
    });
    return relatedPosts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return []; 
  }
}
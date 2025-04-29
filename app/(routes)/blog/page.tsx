import React from 'react';
import BlogPageClient from './BlogPageClient';
import { BlogPost, Category, Pagination } from '@/types/blog'; // Import types from shared types file
import { prisma } from '@/lib/prisma'; // Import Prisma client
import { Prisma } from '@prisma/client'; // Import Prisma namespace for types if needed

// Fetch categories directly using Prisma
async function fetchCategories(): Promise<Category[]> {
  try {
    const categoriesData = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true, // Ensure slug is selected as required by the Category type
      },
      orderBy: {
        name: 'asc',
      },
    });
    // Ensure the fetched data matches the Category type structure
    return categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error fetching categories directly:', error);
    return []; // Return empty array on error
  }
}

// Fetch initial posts directly using Prisma
async function fetchInitialPosts(): Promise<{ posts: BlogPost[]; pagination: Pagination }> {
  const defaultPagination: Pagination = { currentPage: 1, totalPages: 1, totalPosts: 0 };
  const page = 1;
  const limit = 9;
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.BlogPostWhereInput = { status: 'PUBLISHED' };

    // Fetch total count and posts in parallel
    const [totalPosts, postsData] = await prisma.$transaction([
      prisma.blogPost.count({ where: whereClause }),
      prisma.blogPost.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImageUrl: true,
          publishedAt: true,
          author: {
            select: { name: true }, // Select only author name as required by BlogPost type
          },
          categories: {
            select: { name: true, slug: true }, // Select category name and slug
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    // Map Prisma data to BlogPost type, handling potential nulls and date format
    const posts: BlogPost[] = postsData.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '', // Provide default empty string if excerpt is null
      featuredImageUrl: post.featuredImageUrl,
      // Convert Date to ISO string or keep as Date depending on BlogPageClient needs
      // For simplicity, let's convert to ISO string to match the original type definition expectation
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      author: post.author ?? { name: 'Unknown Author' }, // Handle potential null author
      categories: post.categories,
    }));

    return {
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
      },
    };
  } catch (error) {
    console.error('Error fetching initial posts directly:', error);
    return {
      posts: [],
      pagination: defaultPagination, // Return default structure on error
    };
  }
}

export default async function BlogPage() {
  // Fetch data in parallel using direct Prisma access
  const [categories, initialPostData] = await Promise.all([
    fetchCategories(),
    fetchInitialPosts(),
  ]);

  // Destructure posts and pagination from the fetched data
  const { posts: initialPosts, pagination: initialPagination } = initialPostData;

  // Basic check if data fetching returned empty arrays (could indicate an error)
  // Consider more robust error handling if needed
  if (!categories || !initialPosts) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Oops! Something went wrong.</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t load the blog content at this time. Please try refreshing the page or check back later.
        </p>
        {/* Optionally add a refresh button */}
      </div>
    );
  }

  return (
    <BlogPageClient
      initialPosts={initialPosts}
      initialPagination={initialPagination}
      categories={categories}
    />
  );
}
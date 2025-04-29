import { BlogPost, Category, Pagination } from '@/types/blog'; // Import types from shared types file
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import BlogPostCard from '@/components/BlogPostCard'; // Assuming path is correct
import CategoryNavigation from '@/components/CategoryNavigation'; // Assuming path is correct
import PaginationControls from '@/components/PaginationControls'; // Assuming path is correct
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Define types locally for now - ideally move to a central types file
// Ensure these match the actual API response structures

interface BlogPageClientProps {
  initialPosts: BlogPost[];
  initialPagination: Pagination;
  categories: Category[];
}

// Helper function to construct API URL (client-side)
const getApiUrl = (path: string) => {
  // Use NEXT_PUBLIC_API_URL if available, otherwise default for local dev
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/'; // Use relative path for client-side fetches
  return `${baseUrl.replace(/\/$/, '')}${path}`; // Ensure no double slashes
};


export default function BlogPageClient({
  initialPosts,
  initialPagination,
  categories,
}: BlogPageClientProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchPosts = useCallback(async (page: number, categorySlug: string | null) => {
    setIsLoading(true);
    let url = getApiUrl(`/api/blog/posts?page=${page}&limit=9`);
    if (categorySlug) {
      url += `&category=${categorySlug}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.statusText}`);
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { currentPage: page, totalPages: 1, totalPosts: 0 });
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Handle error state appropriately, maybe show a toast notification
      setPosts([]); // Clear posts on error
      setPagination({ currentPage: page, totalPages: 1, totalPosts: 0 }); // Reset pagination
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if getApiUrl is stable

  const handleSelectCategory = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    fetchPosts(1, categorySlug); // Reset to page 1 when category changes
  };

  const handlePageChange = (newPage: number) => {
    fetchPosts(newPage, selectedCategory);
  };

  // Effect to potentially re-sync if initial props change, though usually not needed
  // if the server component handles the initial load correctly.
  useEffect(() => {
    setPosts(initialPosts);
    setPagination(initialPagination);
  }, [initialPosts, initialPagination]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Banner Section */}
      <header className="bg-gray-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cigar Enthusiast Blog
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Explore the world of cigars with us. Discover reviews, tips, news, and insights from fellow aficionados. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 flex-grow">
        {/* Category Navigation */}
        <div className="mb-8 md:mb-12">
          <CategoryNavigation
            categories={categories}
            currentCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Blog Post Grid & Pagination */}
        {isLoading ? (
          // Loading State - Skeleton Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          // Display Posts
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
               <PaginationControls
                 currentPage={pagination.currentPage}
                 totalPages={pagination.totalPages}
                 onPageChange={handlePageChange}
               />
            )}
          </>
        ) : (
          // No Posts Found State
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Posts Found</h2>
            <p className="text-muted-foreground">
              {selectedCategory
                ? `There are no blog posts in the selected category yet.`
                : `There are no blog posts available at the moment.`}
            </p>
            {selectedCategory && (
              <button
                onClick={() => handleSelectCategory(null)}
                className="mt-4 text-primary hover:underline"
              >
                View All Posts
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
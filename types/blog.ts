// types/blog.ts

export enum BlogPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// Define the structure for BlogPostWhereInput based on its usage
export type BlogPostWhereInput = {
  status?: BlogPostStatus;
  // Add other potential fields if needed in the future
};

// Existing types from the original import (assuming these were in the original types/blog file)
// If there were other types in the original import from '@/types/blog', they should be included here.
// Based on the original import: import { BlogPost, Category, Pagination } from '@/types/blog';
// I will include placeholder definitions for BlogPost, Category, and Pagination.

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl: string | null;
  publishedAt: string | null; // Using string to match the ISO string conversion in page.tsx
  author: { name: string } | null;
  categories: { name: string; slug: string }[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
};
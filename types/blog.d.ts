export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl?: string | null;
  author: { name: string };
  categories: { name: string; slug: string }[];
  publishedAt: string | null; // Or Date? Adjust based on API
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}
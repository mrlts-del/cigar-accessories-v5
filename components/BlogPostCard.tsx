import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming Shadcn UI card path
import { Badge } from '@/components/ui/badge'; // Assuming Shadcn UI badge path
import { cn } from '@/lib/utils'; // Assuming Shadcn UI utility function path

interface Category {
  name: string;
  slug: string;
}

// Define the structure for the blog post data
interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl?: string | null; // Allow optional or null
  categories: Category[];
}

interface BlogPostCardProps {
  post: BlogPost;
  className?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, className }) => {
  // Use the first category for the badge, if available
  const primaryCategory = post.categories?.[0];

  // Placeholder image if featuredImageUrl is missing
  const imageUrl = post.featuredImageUrl || 'https://via.placeholder.com/400x250?text=No+Image';

  return (
    <Card className={cn("overflow-hidden transition-shadow duration-300 hover:shadow-lg", className)}>
      <Link href={`/blog/${post.slug}`} className="block group">
        <CardHeader className="p-0 relative aspect-video">
          {/* Use Next/Image for optimization */}
          <Image
            src={imageUrl}
            alt={post.title || 'Blog post image'}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {primaryCategory && (
            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
              {primaryCategory.name}
            </Badge>
          )}
          <CardTitle className="text-lg font-semibold leading-tight mt-1 group-hover:text-primary transition-colors">
            {post.title || 'Untitled Post'}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.excerpt || 'No excerpt available.'}
          </p>
          <div className="text-sm text-primary font-medium mt-3 inline-block">
            Read More &rarr;
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

// Example Usage (can be removed or kept for storybook/testing)
export const BlogPostCardExample: React.FC = () => {
  const placeholderPost: BlogPost = {
    title: "The Future of Web Development with Next.js 15",
    slug: "future-web-dev-nextjs-15",
    excerpt: "Explore the latest features and improvements in Next.js 15 and how they are shaping the future of building performant web applications.",
    featuredImageUrl: "https://via.placeholder.com/400x250/aabbcc/ffffff?text=Next.js+15",
    categories: [{ name: "Web Dev", slug: "web-dev" }, { name: "Frameworks", slug: "frameworks" }],
  };

  return <BlogPostCard post={placeholderPost} className="max-w-sm" />;
};


export default BlogPostCard;
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BlogPostCard from '@/components/BlogPostCard'; 
import Container from '@/components/ui/container'; 
import { Separator } from '@/components/ui/separator'; 
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string; 
  excerpt: string;
  featuredImageUrl?: string | null;
  author: {
    name?: string | null;
  };
  publishedAt: string; 
  categories: { id: string; name: string }[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImageUrl?: string | null;
  categories: { id: string; name: string; slug: string }[]; 
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/blog/posts/${slug}`, {
      next: { revalidate: 3600 } 
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; 
      }
      console.error(`Error fetching post ${slug}: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch post: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching post:', error); 
    throw error;
  }
}

async function getRelatedPosts(slug: string): Promise<RelatedPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/blog/posts/${slug}/related`, {
      next: { revalidate: 3600 * 24 } 
    });

    if (!res.ok) {
      console.error(`Error fetching related posts for ${slug}: ${res.status} ${res.statusText}`);
      return []; 
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return []; 
  }
}

export async function generateMetadata(
  { params }: BlogPostPageProps,
): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for could not be found.',
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || 'Read this blog post.'; 

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [], 
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  const relatedPosts = await getRelatedPosts(slug);

  if (!post) {
    notFound(); 
  }

  const publishedDate = format(new Date(post.publishedAt), 'MMMM d, yyyy'); 

  return (
    <Container>
      <article className="py-8 md:py-12">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {post.title}
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span>By {post.author?.name || 'Staff Writer'}</span>
            <span className="mx-2">•</span>
            <time dateTime={post.publishedAt}>{publishedDate}</time>
          </div>
          {post.featuredImageUrl && (
            <div className="relative w-full h-64 md:h-96 mb-8 overflow-hidden rounded-lg">
              <Image
                src={post.featuredImageUrl}
                alt={`Featured image for ${post.title}`}
                layout="fill"
                objectFit="cover"
                priority 
              />
            </div>
          )}
        </header>

        {/* Post Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-12" 
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator className="my-12" />

        {/* Related Content Section */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard
                  key={relatedPost.id}
                  post={relatedPost} 
                />
              ))}
            </div>
          </section>
        )}
      </article>
    </Container>
  );
};
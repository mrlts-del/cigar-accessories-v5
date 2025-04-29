import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BlogPostCard from '@/components/BlogPostCard'; // Corrected default import
import Container from '@/components/ui/container'; // Assuming this path is correct
import { Separator } from '@/components/ui/separator'; // Assuming this path is correct
import { format } from 'date-fns';

// Define the expected structure of a blog post
interface BlogPost {
    id: string;
    slug: string;
    title: string;
    content: string; // Assuming HTML content
    excerpt: string;
    featuredImageUrl?: string | null;
    author: {
        name?: string | null;
        // Add other author fields if available, e.g., image
    };
    publishedAt: string; // Assuming ISO date string
    categories: { id: string; name: string }[];
    metaTitle?: string | null;
    metaDescription?: string | null;
}

// Define the expected structure for related posts (subset of BlogPost)
interface RelatedPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    featuredImageUrl?: string | null;
    categories: { id: string; name: string; slug: string }[]; // Added slug to category
}


interface BlogPostPageProps {
    params: {
        slug: string;
    };
}

// --- Data Fetching Functions ---

async function getPost(slug: string): Promise<BlogPost | null> {
    try {
        // Adjust the URL based on your actual API setup (absolute URL needed for server components)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/blog/posts/${slug}`, {
            next: { revalidate: 3600 } // Revalidate every hour, adjust as needed
        });

        if (!res.ok) {
            if (res.status === 404) {
                return null; // Post not found
            }
            // Log other errors for debugging
            console.error(`Error fetching post ${slug}: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch post: ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        console.error(`Network or parsing error fetching post ${slug}:`, error);
        // Depending on error handling strategy, you might throw, return null, or return a default object
        throw error; // Re-throw for Next.js to handle potentially
    }
}

async function getRelatedPosts(slug: string): Promise<RelatedPost[]> {
     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/blog/posts/${slug}/related`, {
             next: { revalidate: 3600 * 24 } // Revalidate daily, adjust as needed
        });

        if (!res.ok) {
            // Log errors but don't block the page if related posts fail
            console.error(`Error fetching related posts for ${slug}: ${res.status} ${res.statusText}`);
            return []; // Return empty array on failure
        }
        return await res.json();
    } catch (error) {
        console.error(`Network or parsing error fetching related posts for ${slug}:`, error);
        return []; // Return empty array on failure
    }
}

// --- SEO Metadata Generation ---

export async function generateMetadata(
    { params }: BlogPostPageProps,
): Promise<Metadata> {
    const slug = params.slug;
    const post = await getPost(slug);

    if (!post) {
        // Optionally return default metadata or handle not found case
        return {
            title: 'Post Not Found',
            description: 'The blog post you are looking for could not be found.',
        };
    }

    // Use specific meta fields if available, otherwise fallback
    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || 'Read this blog post.'; // Add a generic fallback

    // Optionally merge with parent metadata
    // const previousImages = (await parent).openGraph?.images || []

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [], // Add image if available
            type: 'article',
            publishedTime: post.publishedAt,
            authors: post.author?.name ? [post.author.name] : [],
            // Add tags/categories if relevant
        },
        // Add other metadata fields as needed (twitter, etc.)
    };
}

// --- Page Component ---

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const slug = params.slug;
    const post = await getPost(slug);
    const relatedPosts = await getRelatedPosts(slug);

    if (!post) {
        notFound(); // Trigger Next.js 404 page
    }

    const publishedDate = format(new Date(post.publishedAt), 'MMMM d, yyyy'); // Format date

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
                                priority // Prioritize loading the main image
                            />
                        </div>
                    )}
                </header>

                {/* Post Content */}
                <div
                    className="prose prose-lg dark:prose-invert max-w-none mb-12" // Apply Tailwind Typography styles
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <Separator className="my-12" />

                {/* Related Content Section */}
                {relatedPosts && relatedPosts.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
                            You May Also Like
                        </h2>
                        {/* Responsive Grid/Scroll */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {relatedPosts.map((relatedPost) => (
                                <BlogPostCard
                                    key={relatedPost.id}
                                    post={relatedPost} // Pass the entire relatedPost object
                                />
                            ))}
                        </div>
                         {/* Consider adding horizontal scroll for mobile if grid looks cramped */}
                         {/* <div className="flex overflow-x-auto space-x-4 pb-4 sm:hidden"> ... </div> */}
                    </section>
                )}
            </article>
        </Container>
    );
}
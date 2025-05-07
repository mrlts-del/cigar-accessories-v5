import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

export const GET = withError(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
});

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({ // Corrected casing to blogPost
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        categories: true,
      },
    });
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}
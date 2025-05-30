import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { OrderStatus } from "@/types/order";

// Zod schema for POST /api/reviews
const reviewBodySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().min(1, "Comment is required"),
});

export type ReviewBody = z.infer<typeof reviewBodySchema>;

// POST handler for submitting a new review
export const POST = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: ReviewBody;
  try {
    const json = await request.json();
    body = reviewBodySchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.errors }, { status: 400 });
    }
    // Handle non-JSON or other request errors
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }

  const { productId, rating, comment } = body;

  // 1. Purchase Verification: Check if the user purchased this product
  const completedOrderStatuses = [OrderStatus.DELIVERED, OrderStatus.PAID]; // Define completed statuses
  const purchase = await prisma.order.findFirst({
    where: {
      userId: userId,
      status: { in: completedOrderStatuses },
      items: {
        some: {
          variant: {
            productId: productId,
          },
        },
      },
    },
    select: { id: true }, // Only need to know if it exists
  });

  if (!purchase) {
    return NextResponse.json({ error: "You must purchase this product to leave a review." }, { status: 403 });
  }

  // 2. Duplicate Check: Check if the user already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: {
      userId: userId,
      productId: productId,
    },
  });

  if (existingReview) {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
  }

  // 3. Create the Review
  const newReview = await prisma.review.create({
    data: {
      userId: userId,
      productId: productId,
      rating: rating,
      comment: comment,
    },
  });

  return NextResponse.json(newReview, { status: 201 });
});

// Zod schema for GET /api/reviews query parameters
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10), // Max 100 per page
});

// GET handler for fetching the current user's reviews
export const GET = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse and validate pagination query parameters
  const { searchParams } = new URL(request.url);
  const validationResult = paginationSchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { page, limit } = validationResult.data;
  const skip = (page - 1) * limit;

  // Fetch reviews and total count in a transaction
  try {
    const [reviews, totalReviews] = await prisma.$transaction([
      prisma.review.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
        include: {
          product: {
            select: {
              name: true,
              imagePath: true,
              slug: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: { userId: userId },
      }),
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    return NextResponse.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        limit,
      },
    });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to fetch reviews:", error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: "You have already submitted a review for this product." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
});
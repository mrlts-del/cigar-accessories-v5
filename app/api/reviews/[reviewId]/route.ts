// app/api/reviews/[reviewId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { withError } from '@/lib/withError';

// Zod schema for PATCH request body (partial update)
const patchReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field (rating or comment) must be provided for update.',
});

// Interface for route parameters
interface RouteParams {
  params: {
    reviewId: string;
  };
}

// Helper function to verify review ownership
async function verifyReviewOwner(userId: string, reviewId: string) {
  // Basic validation for reviewId format (optional, but good practice)
  if (!reviewId || typeof reviewId !== 'string' || reviewId.length !== 24) { // Assuming MongoDB ObjectId length
      return { status: 400, message: 'Invalid review ID format.' };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return { status: 404, message: 'Review not found.' };
  }

  if (review.userId !== userId) {
    return { status: 403, message: 'User is not authorized to modify this review.' };
  }

  return { status: 200, review };
}

// PATCH handler for updating a specific review
export const PATCH = withError(async (request: Request, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { reviewId } = params;

  // Verify ownership and review existence
  const ownerCheck = await verifyReviewOwner(userId, reviewId);
  if (ownerCheck.status !== 200) {
    return NextResponse.json({ error: ownerCheck.message }, { status: ownerCheck.status });
  }

  // Validate request body
  let body;
  try {
    body = await request.json();
  } catch { // Removed unused error variable
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = patchReviewSchema.safeParse(body);
  if (!validation.success) {
    // Check for the specific refinement error first
    const refinementError = validation.error.errors.find(e => e.code === 'custom');
    if (refinementError) {
        return NextResponse.json({ error: refinementError.message }, { status: 400 });
    }
    // Otherwise, return general validation errors
    return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
  }

  const dataToUpdate = validation.data;

  // Ensure at least one field is provided (already handled by refine)
  // if (Object.keys(dataToUpdate).length === 0) {
  //     return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
  // }

  // Update the review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: dataToUpdate,
  });

  return NextResponse.json(updatedReview);
});

// DELETE handler for deleting a specific review
export const DELETE = withError(async (request: Request, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { reviewId } = params;

  // Verify ownership and review existence
  const ownerCheck = await verifyReviewOwner(userId, reviewId);
  if (ownerCheck.status !== 200) {
    return NextResponse.json({ error: ownerCheck.message }, { status: ownerCheck.status });
  }

  // Delete the review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  return new NextResponse(null, { status: 204 }); // No Content
});
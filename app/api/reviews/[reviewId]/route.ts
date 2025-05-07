import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

export const DELETE = withError(async (_request: Request, { params }: { params: Promise<{ reviewId: string }> }) => {
  const { reviewId } = await params;

  await prisma.review.delete({
    where: { id: reviewId },
  });

  return new NextResponse(null, { status: 204 });
});
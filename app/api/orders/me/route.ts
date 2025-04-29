export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic due to header usage for auth
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

// GET handler to fetch current user's orders
export const GET = withError(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const orders = await prisma.order.findMany({
    where: { userId: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true, // Include product details for each order item via variant
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Order by most recent
    },
  });

  return NextResponse.json(orders);
});
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { withError } from '@/lib/withError';
import { prisma } from '@/lib/prisma';

export type GetAdminOrdersResponse = {
  orders: {
    id: string;
    userId: string;
    status: string;
    total: number;
    createdAt: string;
    user?: {
      name?: string | null;
      email?: string | null;
    };
  }[];
  pagination: {
    currentPage: number;
    totalPages: number;
  };
};

export const GET = withError(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Example implementation to fetch orders
  const orders = await prisma.order.findMany({
    include: {
      user: true,
    },
  });

  return NextResponse.json({
    orders,
    pagination: {
      currentPage: 1,
      totalPages: 1,
    },
  });
});
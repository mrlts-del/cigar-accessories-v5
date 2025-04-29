import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { withError } from '@/lib/withError';
import { UserRole } from '@prisma/client';

export const GET = withError(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);

    // 1. Authentication Check
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Authorization Check (Admin Only)
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 3. Data Fetching Logic
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          // emailVerified: true, // Temporarily removed due to TS error, likely needs prisma generate
          role: true,
          createdAt: true,
          updatedAt: true,
          addresses: { // Include related addresses
            select: {
              id: true,
              line1: true, // Correct field name
              line2: true, // Correct field name
              city: true,
              state: true,
              postal: true, // Correct field name
              country: true,
              type: true, // Use type instead of boolean flags
            }
          },
          orders: { // Include related orders (summary)
            select: {
              id: true,
              status: true,
              payment: { select: { amount: true } }, // Get total from Payment amount
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Limit the number of orders initially shown
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 4. Return Response
      return NextResponse.json(user);

    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      // findUniqueOrThrow would throw an error handled by withError
      // This catch block handles other potential errors during processing
      // Use type assertion or check if 'code' exists
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }
  }
);
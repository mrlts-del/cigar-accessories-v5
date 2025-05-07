import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { withError } from '@/lib/withError';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const GET = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);

  // 1. Authentication Check
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2. Authorization Check (Admin Only)
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  // 3. Data Fetching Logic
  try {
    const whereClause: Prisma.UserWhereInput = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        image: true,
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
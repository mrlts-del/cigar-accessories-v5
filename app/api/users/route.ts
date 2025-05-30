import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError"; // Assuming withError is imported

export const dynamic = 'force-dynamic';
// Query params schema for filtering, search, pagination
const userListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  isAdmin: z.enum(["true", "false"]).optional(), // Add isAdmin to schema
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export type UserListItem = {
  id: string;
  email: string | null; // Email can be null based on Prisma schema
  name: string | null; // Name can be null
  isAdmin: boolean; // Change role to isAdmin
  createdAt: string;
  updatedAt: string;
};

export type UserListResponse = {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const GET = withError(async (request: Request) => {
  // Parse query params
  const { searchParams } = new URL(request.url);
  const queryObj: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    queryObj[key] = value;
  }
  const parsed = userListQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { search, page = "1", pageSize = "20", isAdmin: isAdminParam } = parsed.data; // Destructure isAdminParam
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);

  // Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}; // Use any type with ESLint disable comment
  if (isAdminParam !== undefined) { // Check if isAdminParam was provided
    where.isAdmin = isAdminParam === 'true';
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get total count for pagination
  const total = await prisma.user.count({ where });

  // Get paginated users
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (pageNum - 1) * pageSizeNum,
    take: pageSizeNum,
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true, // Change role to isAdmin
      createdAt: true,
      updatedAt: true,
    },
  });

  const result: UserListResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users: users.map((u: any) => ({
      ...u,
      // Ensure email and name are handled if null
      email: u.email ?? null,
      name: u.name ?? null,
      isAdmin: u.isAdmin, // Map isAdmin
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    total,
    page: pageNum,
    pageSize: pageSizeNum,
  };

  return NextResponse.json(result);
});
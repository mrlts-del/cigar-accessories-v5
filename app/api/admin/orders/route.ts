import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
import type { OrderStatus } from 'types/order';
import { z } from "zod";

export const dynamic = 'force-dynamic';
const DEFAULT_PAGE_SIZE = 10;

// Schema for query parameters (pagination, sorting, filtering)
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(DEFAULT_PAGE_SIZE),
  sortBy: z.enum(["createdAt", "total", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.string().optional(), // Allow filtering by status
  search: z.string().optional(), // Allow searching by order ID or customer email/name
});

// Define a type for the where clause to avoid 'any'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderWhereClause = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BasicOrder = any;

async function getAdminOrders(options: z.infer<typeof querySchema>) {
  const { page, limit, sortBy, sortOrder, status, search } = options;

  const skip = (page - 1) * limit;

  // Use the defined type for the where clause
  const whereClause: OrderWhereClause = { deletedAt: null };
  if (status) {
    // Ensure status is a valid OrderStatus enum value if possible, otherwise keep as string
    whereClause.status = status as OrderStatus; // Cast if confident status string matches enum
  }
  if (search) {
    whereClause.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      // Add search by shipping address name if needed
      // { shippingAddress: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // 1. Fetch basic order data + user details + count
  const [basicOrders, totalOrders] = await prisma.$transaction([
    prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        status: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: skip,
      take: limit,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  // 2. Extract order IDs
  const orderIds = basicOrders.map((order: BasicOrder) => order.id);

  // 3. Fetch relevant OrderItems
  const orderItems = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orderIds },
    },
    select: {
      orderId: true,
      quantity: true,
      price: true, // This is Decimal type from Prisma
    },
  });

  // 4. Calculate totals per order
  const orderTotals: { [key: string]: number } = {};
  for (const item of orderItems) {
    const itemTotal = item.quantity * Number(item.price); // Convert Decimal to number
    orderTotals[item.orderId] = (orderTotals[item.orderId] || 0) + itemTotal;
  }

  // 5. Combine data into AdminOrder structure
  const typedOrders: AdminOrder[] = basicOrders.map((order: BasicOrder) => ({
  ...order,
  total: orderTotals[order.id] || 0, // Add calculated total
  status: order.status as string, // Ensure status is string for the type
}));

  return {
    orders: typedOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalOrders,
      pageSize: limit,
    },
  };
}

// Define the shape of the order object returned by the API
export type AdminOrder = {
  id: string;
  createdAt: Date; // Keep as Date
  status: string; // Consider using the OrderStatus enum/type if defined globally
  total: number; // Calculated total
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null; // User might be null if relation is optional or deleted
};

export type GetAdminOrdersResponse = {
  orders: AdminOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    pageSize: number;
  };
};

export const GET = withError(async (request: Request) => {
  // Authentication and Authorization
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parsedQuery = querySchema.safeParse(queryParams);

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  const result = await getAdminOrders(parsedQuery.data);

  return NextResponse.json(result);
});
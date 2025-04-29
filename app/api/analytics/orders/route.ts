import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client"; // Import Prisma namespace

export const dynamic = 'force-dynamic';
// Define a more flexible type for the handler function
type RequestHandler = (request: Request, ...args: unknown[]) => Promise<Response | NextResponse>;

// Error handler wrapper
function withError(handler: RequestHandler) {
  return async (request: Request, ...args: unknown[]) => { // Pass request and args
    try {
      return await handler(request, ...args); // Pass request and args
    } catch (error: unknown) { // Use unknown for error
      console.error(error);
      return NextResponse.json(
        // Check if error is an object with message/status properties
        { error: (error instanceof Error ? error.message : "Internal Server Error") },
        { status: (error && typeof error === 'object' && 'status' in error ? error.status as number : 500) }
      );
    }
  };
}

// Admin authentication helper (re-add request parameter)
async function adminAuth() { // Removed unused _request parameter
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }
  // Query user to check role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}

// Zod schema for query params
const querySchema = z.object({
  range: z.enum(["daily", "weekly", "monthly"]),
  product: z.string().optional(),
  category: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export type AnalyticsOrdersQuery = z.infer<typeof querySchema>;

export type AnalyticsOrdersResponse = {
  orders: {
    date: string;
    orderCount: number;
  }[];
};

function toCSV(data: AnalyticsOrdersResponse["orders"]): string {
  const header = "date,orderCount";
  const rows = data.map((row) => `${row.date},${row.orderCount}`);
  return [header, ...rows].join("\n");
}

export const GET = withError(async (request: Request) => {
  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const queryObj: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    queryObj[key] = value;
  }
  const parsed = querySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { range, product, category, format } = parsed.data;

  // Admin authentication
  const authResult = await adminAuth(); // Removed request argument as it's unused in adminAuth
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Build date range
  const now = new Date();
  let startDate: Date;
  if (range === "daily") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
  } else if (range === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 12 * 7);
  } else {
    // monthly
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 12);
  }

  // Build filters
  const where: Prisma.OrderWhereInput = { // Use Prisma type
    createdAt: { gte: startDate },
    ...(product ? { items: { some: { variant: { productId: product } } } } : {}),
    ...(category ? { items: { some: { variant: { product: { categories: { some: { id: category } } } } } } } : {}),
    deletedAt: null,
  };

  // Aggregate order volume
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Group and aggregate
  const orderMap: Record<string, number> = {};

  for (const order of orders) {
    let key: string;
    const date = new Date(order.createdAt);
    if (range === "daily") {
      key = date.toISOString().slice(0, 10);
    } else if (range === "weekly") {
      const week = getISOWeek(date);
      key = `${date.getFullYear()}-W${week}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!orderMap[key]) {
      orderMap[key] = 0;
    }
    orderMap[key] += 1;
  }

  // Format result
  const ordersArr = Object.entries(orderMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, orderCount]) => ({
      date,
      orderCount,
    }));

  if (format === "csv") {
    const csv = toCSV(ordersArr);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });
  }

  const result: AnalyticsOrdersResponse = { orders: ordersArr };
  return NextResponse.json(result);
});

// Helper: Get ISO week number
function getISOWeek(date: Date): string {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return String(
    1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      )
  ).padStart(2, "0");
}
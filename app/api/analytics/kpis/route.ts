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

export type AnalyticsKpisQuery = z.infer<typeof querySchema>;

export type AnalyticsKpisResponse = {
  kpis: {
    date: string;
    sales: number;
    revenue: number;
    orders: number;
    customers: number;
  }[];
};

function toCSV(data: AnalyticsKpisResponse["kpis"]): string {
  const header = "date,sales,revenue,orders,customers";
  const rows = data.map(
    (row) =>
      `${row.date},${row.sales},${row.revenue},${row.orders},${row.customers}`
  );
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

  // Aggregate KPIs
  // For simplicity, group by day/week/month using JS (could optimize with raw SQL if needed)
  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
      user: true,
    },
  });

  // Group and aggregate
  const kpiMap: Record<string, { sales: number; revenue: number; orders: number; customers: Set<string> }> = {};

  for (const order of orders) {
    let key: string;
    const date = new Date(order.createdAt);
    if (range === "daily") {
      key = date.toISOString().slice(0, 10);
    } else if (range === "weekly") {
      // ISO week string: YYYY-Www
      const week = getISOWeek(date);
      key = `${date.getFullYear()}-W${week}`;
    } else {
      // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!kpiMap[key]) {
      kpiMap[key] = { sales: 0, revenue: 0, orders: 0, customers: new Set() };
    }
    kpiMap[key].orders += 1;
    kpiMap[key].revenue += order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    kpiMap[key].sales += order.items.reduce((sum, item) => sum + item.quantity, 0);
    kpiMap[key].customers.add(order.userId);
  }

  // Format result
  const kpis = Object.entries(kpiMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      sales: v.sales,
      revenue: v.revenue,
      orders: v.orders,
      customers: v.customers.size,
    }));

  if (format === "csv") {
    const csv = toCSV(kpis);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=kpis.csv",
      },
    });
  }

  const result: AnalyticsKpisResponse = { kpis };
  return NextResponse.json(result);
});

// Helper: Get ISO week number
function getISOWeek(date: Date): string {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  // January 4 is always in week 1
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1
  return String(
    1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      )
  ).padStart(2, "0");
}
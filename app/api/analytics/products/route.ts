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
  category: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export type AnalyticsProductsQuery = z.infer<typeof querySchema>;

export type AnalyticsProductsResponse = {
  products: {
    productId: string;
    productName: string;
    date: string;
    sales: number;
    revenue: number;
    orderCount: number;
  }[];
};

function toCSV(data: AnalyticsProductsResponse["products"]): string {
  const header = "productId,productName,date,sales,revenue,orderCount";
  const rows = data.map(
    (row) =>
      `${row.productId},${row.productName},${row.date},${row.sales},${row.revenue},${row.orderCount}`
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
  const { range, category, format } = parsed.data;

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
  const orderWhere: Prisma.OrderWhereInput = { // Use Prisma type
    createdAt: { gte: startDate },
    deletedAt: null,
  };

  // Get all order items in range, with product info
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: orderWhere,
      ...(category
        ? { variant: { product: { categories: { some: { id: category } } } } }
        : {}),
    },
    include: {
      order: true,
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  // Group and aggregate by product and period
  type ProductKey = string; // `${productId}|${date}`
  const productMap: Record<
    ProductKey,
    { productId: string; productName: string; date: string; sales: number; revenue: number; orderIds: Set<string> }
  > = {};

  for (const item of orderItems) {
    const productId = item.variant.product.id;
    const productName = item.variant.product.name;
    const dateObj = new Date(item.order.createdAt);
    let date: string;
    if (range === "daily") {
      date = dateObj.toISOString().slice(0, 10);
    } else if (range === "weekly") {
      const week = getISOWeek(dateObj);
      date = `${dateObj.getFullYear()}-W${week}`;
    } else {
      date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    }
    const key = `${productId}|${date}`;
    if (!productMap[key]) {
      productMap[key] = {
        productId,
        productName,
        date,
        sales: 0,
        revenue: 0,
        orderIds: new Set(),
      };
    }
    productMap[key].sales += item.quantity;
    productMap[key].revenue += Number(item.price) * item.quantity;
    productMap[key].orderIds.add(item.orderId);
  }

  // Format result
  const productsArr = Object.values(productMap)
    .map((v) => ({
      productId: v.productId,
      productName: v.productName,
      date: v.date,
      sales: v.sales,
      revenue: v.revenue,
      orderCount: v.orderIds.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.productName.localeCompare(b.productName));

  if (format === "csv") {
    const csv = toCSV(productsArr);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products.csv",
      },
    });
  }

  const result: AnalyticsProductsResponse = { products: productsArr };
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
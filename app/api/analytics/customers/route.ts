import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';
// Define a more flexible type for the handler function
// It accepts Request and potentially other args, returns Promise<Response | NextResponse>
type RequestHandler = (request: Request, ...args: unknown[]) => Promise<Response | NextResponse>;

// Error handler wrapper
function withError(handler: RequestHandler) {
  // Pass request and other args correctly
  return async (request: Request, ...args: unknown[]) => {
    try {
      // Pass request and args to the handler
      return await handler(request, ...args);
    } catch (error: unknown) {
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
    select: { isAdmin: true },
  });
  if (!user || !user.isAdmin) {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}

// Zod schema for query params
const querySchema = z.object({
  range: z.enum(["daily", "weekly", "monthly"]),
  format: z.enum(["json", "csv"]).default("json"),
});

export type AnalyticsCustomersQuery = z.infer<typeof querySchema>;

export type AnalyticsCustomersResponse = {
  customers: {
    date: string;
    newCustomers: number;
  }[];
};

function toCSV(data: AnalyticsCustomersResponse["customers"]): string {
  const header = "date,newCustomers";
  const rows = data.map((row) => `${row.date},${row.newCustomers}`);
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
  const { range, format } = parsed.data;

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

  // Get new customers in range
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
      // deletedAt: null, // Removed as per schema
      // role: "CUSTOMER", // Removed as per schema
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Group and aggregate
  const customerMap: Record<string, number> = {};

  for (const user of users) {
    let key: string;
    const date = new Date(user.createdAt);
    if (range === "daily") {
      key = date.toISOString().slice(0, 10);
    } else if (range === "weekly") {
      const week = getISOWeek(date);
      key = `${date.getFullYear()}-W${week}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!customerMap[key]) {
      customerMap[key] = 0;
    }
    customerMap[key] += 1;
  }

  // Format result
  const customersArr = Object.entries(customerMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, newCustomers]) => ({
      date,
      newCustomers,
    }));

  if (format === "csv") {
    const csv = toCSV(customersArr);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=customers.csv",
      },
    });
  }

  const result: AnalyticsCustomersResponse = { customers: customersArr };
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
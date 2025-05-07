import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { withError } from "@/lib/withError";

export type AnalyticsKpisResponse = {
  totalRevenue: { value: number; change: number | null };
  totalOrders: { value: number; change: number | null };
  totalCustomers: { value: number; change: number | null };
  averageOrderValue: { value: number; change: number | null };
};

export const GET = withError(async () => {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({
    totalRevenue: { value: 1000, change: 10 },
    totalOrders: { value: 100, change: 5 },
    totalCustomers: { value: 50, change: 2 },
    averageOrderValue: { value: 10, change: 1 },
  });
});
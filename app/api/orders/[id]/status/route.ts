import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { withError } from "@/lib/withError";

export const PATCH = withError(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Example implementation to update order status
  return NextResponse.json({ message: "Order status updated successfully" });
});
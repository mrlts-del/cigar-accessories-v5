import { NextResponse } from "next/server";
import { withError } from "@/lib/withError";

export const GET = withError(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Logic to fetch user by ID
  return NextResponse.json({ id });
});
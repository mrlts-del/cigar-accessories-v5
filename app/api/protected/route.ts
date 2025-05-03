import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from 'lib/authOptions';

export async function GET() { // Removed unused request parameter
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "You are authenticated",
    user: session.user,
  });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

export const GET = withError(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await getUserDetails(id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
});

async function getUserDetails(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          take: 10, 
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
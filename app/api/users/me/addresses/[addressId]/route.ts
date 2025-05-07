import { NextResponse } from "next/server";
import { withError } from "@/lib/withError";
import { prisma } from "@/lib/prisma";

export const DELETE = withError(async (_request: Request, { params }: { params: Promise<{ addressId: string }> }) => {
  const { addressId } = await params;

  await prisma.address.delete({
    where: { id: addressId },
  });

  return new NextResponse(null, { status: 204 });
});
// File: app/api/users/me/addresses/[addressId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { Prisma, AddressType } from "@prisma/client";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

// Zod schema for PATCH - make all fields optional
const partialAddressSchema = z.object({
  type: z.nativeEnum(AddressType).optional(),
  line1: z.string().min(1, "Address line 1 cannot be empty").optional(),
  line2: z.string().optional().nullable(), // Allow explicitly setting line2 to null
  city: z.string().min(1, "City cannot be empty").optional(),
  state: z.string().min(1, "State cannot be empty").optional(),
  postal: z.string().min(1, "Postal code cannot be empty").optional(),
  country: z.string().min(1, "Country cannot be empty").optional(),
});

type PartialAddressInput = z.infer<typeof partialAddressSchema>;

interface RouteParams {
  params: { addressId: string };
}

// Helper function to verify address ownership
async function verifyAddressOwner(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!address) {
    return { authorized: false, status: 404, message: "Address not found" };
  }
  if (address.userId !== userId) {
    return { authorized: false, status: 403, message: "Forbidden" };
  }
  return { authorized: true };
}

// PATCH handler to update an existing address
export const PATCH = withError(async (request: Request, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);
  const addressId = params.addressId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Verify ownership
  const ownerCheck = await verifyAddressOwner(userId, addressId);
  if (!ownerCheck.authorized) {
    return NextResponse.json({ message: ownerCheck.message }, { status: ownerCheck.status });
  }

  let body: PartialAddressInput;
  try {
    body = await request.json();
  } catch { // Removed unused error variable
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  // Explicitly handle setting line2 to null if provided as such in the body
  const dataToValidate = { ...body };
  // Use Object.prototype.hasOwnProperty.call for safety
  if (Object.prototype.hasOwnProperty.call(body, 'line2') && body.line2 === null) {
      dataToValidate.line2 = null;
  } else if (body.line2 === undefined) {
      // If line2 is not in the body, don't include it in validation/update
      delete dataToValidate.line2;
  }


  const validation = partialAddressSchema.safeParse(dataToValidate);
  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: validation.error.errors },
      { status: 400 }
    );
  }

  const dataToUpdate = validation.data;

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json(
      { message: "No valid fields provided for update" },
      { status: 400 }
    );
  }

  try {
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Failed to update address:", error);
    // Handle potential Prisma errors
    return NextResponse.json(
      { message: "Failed to update address" },
      { status: 500 }
    );
  }
});

// DELETE handler to remove an address
export const DELETE = withError(async (_request: Request, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);
  const addressId = params.addressId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Verify ownership
  const ownerCheck = await verifyAddressOwner(userId, addressId);
  if (!ownerCheck.authorized) {
    return NextResponse.json({ message: ownerCheck.message }, { status: ownerCheck.status });
  }

  try {
    // Check if address is used in any orders (optional - depends on desired behavior)
    // const ordersUsingAddress = await prisma.order.count({
    //   where: { OR: [{ shippingAddrId: addressId }, { billingAddrId: addressId }] }
    // });
    // if (ordersUsingAddress > 0) {
    //   return NextResponse.json({ message: "Cannot delete address used in existing orders" }, { status: 400 });
    // }

    await prisma.address.delete({
      where: { id: addressId },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Failed to delete address:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record to delete not found (already handled by verifyAddressOwner, but good practice)
        return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to delete address" },
      { status: 500 }
    );
  }
});
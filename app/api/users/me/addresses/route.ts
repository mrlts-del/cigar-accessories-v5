// File: app/api/users/me/addresses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
// Removed Prisma import as it's not used directly
import { AddressType } from "@/types/address"; // Import AddressType from local definition

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";

// Zod schema matching the Prisma Address model
const addressSchema = z.object({
  type: z.nativeEnum(AddressType), // Use the enum from Prisma
  line1: z.string().min(1, "Address line 1 cannot be empty"),
  line2: z.string().optional(), // Optional field
  city: z.string().min(1, "City cannot be empty"),
  state: z.string().min(1, "State cannot be empty"),
  postal: z.string().min(1, "Postal code cannot be empty"),
  country: z.string().min(1, "Country cannot be empty"),
  // Add phone number or other fields if needed
});

export type AddressInput = z.infer<typeof addressSchema>;

// GET handler to fetch addresses for the current user
export const GET = withError(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json({ message: "Failed to fetch addresses" }, { status: 500 });
  }
});

// POST handler to add a new address for the current user
export const POST = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: AddressInput;
  try {
    body = await request.json();
  } catch { // Removed unused error variable
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const validation = addressSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: validation.error.errors },
      { status: 400 }
    );
  }

  // No default logic needed based on current schema
  const addressData = validation.data;

  try {
    // Create the new address directly
    const newAddress = await prisma.address.create({
      data: {
        ...addressData, // Spread validated data (line1, city, etc.)
        userId: userId, // Associate with the current user
      },
    });

    return NextResponse.json(newAddress, { status: 201 });

  } catch (error) {
    console.error("Failed to create address:", error);
    // Handle potential Prisma errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
      // Handle specific errors if necessary
      return NextResponse.json({ message: "Specific error message" }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Failed to create address" },
      { status: 500 }
    );
  }
});

// Note: GET handler for listing addresses could be added here or fetched via GET /api/users/me
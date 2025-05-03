// File: app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError"; // Assuming withError exists and handles errors

// Schema for PATCH request body validation
const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  // Add other updatable fields here if needed in the future
});

// GET handler to fetch current user's profile and addresses
export const GET = withError(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true, // Include user's addresses
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Exclude password hash before sending response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user; // Keep destructuring but mark password unused

  return NextResponse.json(userWithoutPassword);
});

// PATCH handler to update current user's profile
export const PATCH = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  let body;

  try {
    body = await request.json();
  } catch { // Removed unused error variable
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: validation.error.errors },
      { status: 400 }
    );
  }

  const dataToUpdate: { name?: string } = {};
  if (validation.data.name) {
    dataToUpdate.name = validation.data.name;
  }
  // Add other fields from validation.data if they exist

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json(
      { message: "No valid fields provided for update" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  // Exclude password hash before sending response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = updatedUser; // Keep destructuring but mark password unused

  return NextResponse.json(userWithoutPassword);
});
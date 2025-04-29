import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { withError } from '@/lib/withError';
import { UserRole, Prisma } from '@prisma/client'; // Import Prisma namespace and UserRole

// Define a type for the handler function context specific to this route
type RouteContext = { params: { id: string } };
// Removed unused RequestHandler type definition

// Removed local withError definition, using imported one

// PATCH /api/users/[id] - Update user (admin only)
const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export const PATCH = withError(
  async (request: Request, { params }: RouteContext) => { // Use RouteContext
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Fetch the current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email, deletedAt: null },
      select: { role: true },
    });
    if (!currentUser || currentUser.role !== UserRole.ADMIN) { // Use UserRole enum
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const { id } = params; // id is guaranteed by RouteContext
    if (!id) { // Keep check just in case, though TS should prevent this
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const json = await request.json();
    const parsed = userUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    // Use Prisma type for update data
    const updateData: Prisma.UserUpdateInput = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;

    // Don't allow updating deleted users
    const user = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }
);

// DELETE /api/users/[id] - Soft delete user (admin only)
export const DELETE = withError(
  async (_request: Request, { params }: RouteContext) => { // Use RouteContext
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Fetch the current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email, deletedAt: null },
      select: { role: true },
    });
    if (!currentUser || currentUser.role !== UserRole.ADMIN) { // Use UserRole enum
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    // Don't allow deleting already deleted users
    const user = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }
);

// GET /api/users/[id] - Get user detail with orders and addresses
export const GET = withError(
  async (
    _request: Request,
    { params }: RouteContext // Use RouteContext
  ) => {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Add admin check for accessing arbitrary user details
    const session = await getServerSession(authOptions);
     if (!session?.user?.email) {
       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
     }
     const currentUser = await prisma.user.findUnique({
       where: { email: session.user.email, deletedAt: null },
       select: { role: true },
     });
     if (!currentUser || currentUser.role !== UserRole.ADMIN) {
       return NextResponse.json({ error: "Not authorized" }, { status: 403 });
     }
     // End admin check

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        orders: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            shippingAddr: true,
            billingAddr: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      addresses: user.addresses.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      orders: user.orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        shippingAddr: o.shippingAddr
          ? {
              ...o.shippingAddr,
              createdAt: o.shippingAddr.createdAt.toISOString(),
              updatedAt: o.shippingAddr.updatedAt.toISOString(),
            }
          : null,
        billingAddr: o.billingAddr
          ? {
              ...o.billingAddr,
              createdAt: o.billingAddr.createdAt.toISOString(),
              updatedAt: o.billingAddr.updatedAt.toISOString(),
            }
          : null,
      })),
    });
  }
);
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Removed unused z import
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { withError } from "@/lib/withError"; // Use shared error handler
import { UserRole } from "@prisma/client"; // Import UserRole

// Removed local withError definition
// GET /api/orders/:id - Get order details
export const GET = withError(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    // 1. Get authenticated user session
    const session = await getServerSession(authOptions); // Revert to getServerSession
    if (!session?.user?.id || !session.user.role) { // Ensure role is available
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    // Role is needed for authorization check below
    const userRole = session.user.role;

    // 2. Get order ID from params
    const { id } = await params;

    // 3. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { // Include user details for admin view
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: { // Include product details within items
          include: { // Correct include path: OrderItem -> Variant -> Product
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    // image: true, // Temporarily remove due to TS error
                  }
                }
              }
            }
          }
        },
        payment: true,
        shippingAddr: true,
        billingAddr: true,
      },
    });

    // 4. Check if order exists
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 5. Authorization Check: Allow if user is ADMIN or owns the order
    const isAdmin = userRole === UserRole.ADMIN; // Use userRole from session
    const isOwner = order.userId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Return the order details
    return NextResponse.json({ order });
  }
);

// DELETE /api/orders/:id - Soft delete order (requires ?confirm=true)
export const DELETE = withError(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    // 1. Authentication Check
    const session = await getServerSession(authOptions); // Revert to getServerSession
    if (!session?.user?.id || !session.user.role) { // Ensure role is available
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Get order ID from params
    const { id } = await params;

    // 3. Check confirmation query param
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");
    if (confirm !== "true") {
      return NextResponse.json(
        { error: "Confirmation required to delete order" },
        { status: 400 }
      );
    }

    // 4. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null }, // Ensure it's not already deleted
    });

    // 5. Check if order exists
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 6. Authorization Check: Allow if user is ADMIN or owns the order
    const isAdmin = userRole === UserRole.ADMIN;
    const isOwner = order.userId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 7. Proceed with deletion (soft delete)
    const deleted = await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ order: deleted });
  }
);
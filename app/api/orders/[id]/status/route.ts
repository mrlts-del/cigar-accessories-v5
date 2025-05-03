import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { withError } from "@/lib/withError";
import { OrderStatus } from "@/types/order";
import { sendOrderStatusUpdateEmail } from "@/lib/emailService";

// OrderStatus enum values
const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatusType = OrderStatus;

// Allowed status transitions
// Use OrderStatus enum values directly
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

// Zod schema for PATCH body
const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

// Removed local withError definition, using shared one from lib
// PATCH /api/orders/:id/status - Update order status
export const PATCH = withError(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    // Authentication and Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { status: newStatus } = parsed.data; // Rename for clarity

    // Fetch current order for validation
    const currentOrder = await prisma.order.findUnique({
      where: { id, deletedAt: null },
    });
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate allowed transition
    const allowed = ALLOWED_TRANSITIONS[currentOrder.status as OrderStatusType];
    if (!allowed || !allowed.includes(newStatus as OrderStatusType)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentOrder.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Update status and fetch user details for email
    const updatedOrderWithUser = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Send email notification asynchronously (fire-and-forget)
    if (updatedOrderWithUser.user?.email) {
      try {
        console.log(`Order ${updatedOrderWithUser.id} status updated to ${newStatus}. Attempting to send notification email to ${updatedOrderWithUser.user.email}`);
        sendOrderStatusUpdateEmail({
          to: updatedOrderWithUser.user.email,
          customerName: updatedOrderWithUser.user.name,
          orderId: updatedOrderWithUser.id,
          newStatus: updatedOrderWithUser.status,
        }).then(result => {
          if (!result.success) {
            console.error(`Failed to send status update email for order ${updatedOrderWithUser.id}:`, result.error || 'Unknown email sending error');
          } else {
            console.log(`Status update email successfully queued for order ${updatedOrderWithUser.id}. Email ID: ${result.data?.id}`);
          }
        }).catch(emailError => {
          console.error(`Unhandled error sending status update email for order ${updatedOrderWithUser.id}:`, emailError);
        });
      } catch (syncError) {
        console.error(`Synchronous error trying to initiate status update email for order ${updatedOrderWithUser.id}:`, syncError);
      }
    } else {
      console.warn(`Order ${updatedOrderWithUser.id} updated to ${newStatus}, but user email not found. Skipping notification.`);
    }

    const { ...orderData } = updatedOrderWithUser;
    return NextResponse.json({ order: orderData });
  }
);
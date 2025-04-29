import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Define a more flexible type for the handler function
type RequestHandler = (request: Request, ...args: unknown[]) => Promise<Response | NextResponse>;

// Error handler wrapper
function withError(handler: RequestHandler) {
  return async (request: Request, ...args: unknown[]) => { // Pass request and args
    try {
      return await handler(request, ...args); // Pass request and args
    } catch (error: unknown) { // Use unknown for error
      console.error(error);
      return NextResponse.json(
        // Check if error is an object with message/status properties
        { error: (error instanceof Error ? error.message : "Internal Server Error") },
        { status: (error && typeof error === 'object' && 'status' in error ? error.status as number : 500) }
      );
    }
  };
}

// Zod schema for merge input
const mergeSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

// POST /api/cart/merge - Merge guest cart into user cart
export const POST = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  const userId = user.id;

  const json = await request.json();
  const parsed = mergeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items } = parsed.data;

  // Find or create cart
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  // Build a map of current cart items for quick lookup
  const existingItems = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
  });
  const existingMap = new Map<string, { id: string; quantity: number }>();
  for (const item of existingItems) {
    existingMap.set(item.variantId, { id: item.id, quantity: item.quantity });
  }

  // Validate all variants and stock first
  for (const { variantId, quantity } of items) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || variant.product.deletedAt) {
      return NextResponse.json(
        { error: `Product or variant not found for variantId: ${variantId}` },
        { status: 404 }
      );
    }
    // Calculate intended quantity (existing + incoming)
    const existing = existingMap.get(variantId);
    const intendedQty = existing ? existing.quantity + quantity : quantity;
    if (variant.inventory < intendedQty) {
      return NextResponse.json(
        { error: `Insufficient stock for variantId: ${variantId}` },
        { status: 409 }
      );
    }
  }

  // All validation passed, perform merge
  for (const { variantId, quantity } of items) {
    const existing = existingMap.get(variantId);
    if (existing) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
});
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CartItem, Variant, Product } from "@prisma/client"; // Import necessary types

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

// Zod schemas
const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const updateItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const removeItemSchema = z.object({
  variantId: z.string().uuid(),
});

// GET /api/cart - Get current user's cart
export const GET = withError(async () => { // Removed unused _request parameter
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  const userId = user.id;

  // Find cart and items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    // Return empty cart structure
    return NextResponse.json({ cart: { items: [] } });
  }

  // Define a type for the populated cart item
  type PopulatedCartItem = CartItem & {
    variant: Variant & {
      product: Product;
    };
  };

  // Shape response using the defined type
  const items = (cart.items as PopulatedCartItem[]).map((item) => ({
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      size: item.variant.size,
      color: item.variant.color,
      sku: item.variant.sku,
      inventory: item.variant.inventory,
      price: item.variant.price,
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        image: item.variant.product.imagePath ?? null,
        slug: item.variant.product.slug,
      },
    },
  }));

  return NextResponse.json({ cart: { id: cart.id, items } });
});

// POST /api/cart - Add item to cart
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
  const parsed = addItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { variantId, quantity } = parsed.data;

  // Validate variant exists and is not soft-deleted
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || variant.product.deletedAt) {
    return NextResponse.json({ error: "Product or variant not found" }, { status: 404 });
  }
  if (variant.inventory < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }

  // Find or create cart
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  // Check if item already exists
  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (variant.inventory < newQuantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
    }
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
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

  return NextResponse.json({ success: true });
});

// PATCH /api/cart - Update item quantity
export const PATCH = withError(async (request: Request) => {
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
  const parsed = updateItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { variantId, quantity } = parsed.data;

  // Validate variant exists and is not soft-deleted
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || variant.product.deletedAt) {
    return NextResponse.json({ error: "Product or variant not found" }, { status: 404 });
  }
  if (variant.inventory < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }

  // Find cart
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Find item
  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
  });
  if (!item) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return NextResponse.json({ success: true });
});

// DELETE /api/cart - Remove item from cart
export const DELETE = withError(async (request: Request) => {
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
  const parsed = removeItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { variantId } = parsed.data;

  // Find cart
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Find item
  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, variantId },
  });
  if (!item) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({
    where: { id: item.id },
  });

  return NextResponse.json({ success: true });
});
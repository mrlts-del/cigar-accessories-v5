import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { withError } from '@/lib/withError';

// Define a type for the handler function context specific to this route
type UserHandlerContext = {
  params: {
    id: string;
  };
};

// GET handler to fetch a user by ID
export const GET = withError(async (request: Request, context: UserHandlerContext) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = context.params;

  if (id !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: {
            items: true,
            payment: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: user.isAdmin,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      addresses: user.addresses.map((a: any) => ({
        id: a.id,
        type: a.type,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        postal: a.postal,
        country: a.country,
      })),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      orders: user.orders.map((o: any) => ({
        id: o.id,
        status: o.status,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: o.items.map((item: any) => ({
          id: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        payment: o.payment
          ? {
              id: o.payment.id,
              status: o.payment.status,
              amount: o.payment.amount,
              provider: o.payment.provider,
              transactionId: o.payment.transactionId,
              createdAt: o.payment.createdAt,
              updatedAt: o.payment.updatedAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
});
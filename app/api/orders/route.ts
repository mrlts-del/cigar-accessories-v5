/// <reference types="node" />
import { z } from "zod";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { withError } from "@/lib/withError";
// Import necessary types
import { OrderStatus, PaymentStatus, Prisma, Address /*, AddressType*/ } from "@prisma/client"; // Removed unused AddressType
import { Decimal } from "@prisma/client/runtime/library";
import { sendOrderConfirmationEmail, OrderConfirmationData } from "@/lib/emailService"; // Added OrderConfirmationData

// Custom error for insufficient inventory
class InsufficientInventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientInventoryError";
  }
}
// Zod schema for request body validation
const checkoutBodySchema = z.object({
  tappayPrime: z.string().min(1, "TapPay Prime is required"),
  shippingAddressId: z.string().uuid("Invalid Shipping Address ID"),
  billingAddressId: z.string().uuid("Invalid Billing Address ID").optional(),
});
type CheckoutBody = z.infer<typeof checkoutBodySchema>;

// TapPay API Response Types (simplified)
interface TapPaySuccessResponse {
  status: 0;
  msg: string;
  rec_trade_id: string;
  bank_transaction_id: string;
  order_number: string;
  acquirer: string;
}
interface TapPayErrorResponse {
  status: number;
  msg: string;
}
type TapPayResponse = TapPaySuccessResponse | TapPayErrorResponse;

// --- Business Logic ---

// Type for cart items with included relations
type CartItemWithDetails = Prisma.CartItemGetPayload<{
  include: {
    variant: {
      include: {
        product: true;
      };
    };
  };
}>;

// Define type for the fully populated order needed for email
type OrderWithDetails = Prisma.OrderGetPayload<{
    include: {
        items: { include: { variant: { include: { product: true } } } },
        payment: true,
        shippingAddr: true, // Use correct relation name
        billingAddr: true,  // Use correct relation name
        user: { select: { id: true, name: true, email: true } }
    }
}>;

// Define type for user details needed for email
type UserDetails = { id: string; name: string | null; email: string | null };

// Define type for simplified order item structure for email
// Removed unused EmailOrderItem type


// Removed unused OrderForEmail type definition

async function processCheckout(body: CheckoutBody, userEmail: string) {
  const { tappayPrime, shippingAddressId, billingAddressId } = body;
  const effectiveBillingAddressId = billingAddressId || shippingAddressId;

  // 1. Fetch User and Cart Data
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      cart: {
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
      },
    },
  });

  if (!user) throw new Error("User not found.");
  if (!user.cart || user.cart.items.length === 0) throw new Error("Cart is empty.");

  const cartItems: CartItemWithDetails[] = user.cart.items;

  // 2. Fetch Addresses and Validate Ownership
  const shippingAddress = await prisma.address.findUnique({
    where: { id: shippingAddressId },
  });
  if (!shippingAddress || shippingAddress.userId !== user.id) {
    throw new Error("Invalid shipping address.");
  }

  let billingAddress: Address = shippingAddress; // Default to shipping address
  if (effectiveBillingAddressId !== shippingAddressId) {
    const foundBillingAddress = await prisma.address.findUnique({
      where: { id: effectiveBillingAddressId },
    });
    if (!foundBillingAddress || foundBillingAddress.userId !== user.id) {
      throw new Error("Invalid billing address.");
    }
    billingAddress = foundBillingAddress;
  }
  // billingAddress is now guaranteed non-null

  // 3. Calculate Total Amount
  let totalAmount = new Decimal(0);
  for (const item of cartItems) {
    if (!item.variant?.price) { // Safe navigation and check for null/undefined price
      throw new Error(`Invalid variant data for cart item ${item.id}`);
    }
    totalAmount = totalAmount.plus(item.variant.price.times(item.quantity));
  }
  const amountForTapPay = totalAmount.toNumber();

  // 4. TapPay Payment Processing
  const tappayUrl = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime";
  const tappayServerKey = process.env.TAPPAY_SERVER_KEY;
  const tappayMerchantId = process.env.TAPPAY_MERCHANT_ID;

  if (!tappayServerKey || !tappayMerchantId) {
    console.error("TapPay credentials missing.");
    throw new Error("Payment configuration error.");
  }

  const tappayPayload = {
    prime: tappayPrime,
    partner_key: tappayServerKey,
    merchant_id: tappayMerchantId,
    amount: amountForTapPay,
    currency: "TWD",
    details: `Order from Cigar Accessories V5 - User ${user.id}`,
    cardholder: {
      phone_number: "+886912345678", // Placeholder
      name: user.name || "Customer",
      email: user.email,
    },
    remember: false,
  };

  let tappayResponse: TapPayResponse;
  try {
    const response = await fetch(tappayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": tappayServerKey },
      body: JSON.stringify(tappayPayload),
    });
    tappayResponse = await response.json();
    if (!response.ok && tappayResponse.status === undefined) {
       console.error("TapPay API request failed:", response.status, await response.text());
       throw new Error(`Payment gateway communication error (${response.status}).`);
    }
  } catch (error) {
    console.error("Error calling TapPay API:", error);
    throw new Error("Failed to communicate with payment gateway.");
  }

  // 5. Handle TapPay Response and Create Order (Transaction)
  if (tappayResponse.status !== 0) {
    console.error("TapPay Payment Failed:", tappayResponse);
    throw new Error(`Payment Error: ${tappayResponse.msg || "Payment failed."} (Status: ${tappayResponse.status})`);
  }

  const successfulTapPayResponse = tappayResponse as TapPaySuccessResponse;
  const recTradeId = successfulTapPayResponse.rec_trade_id;

  let orderId: string | null = null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // --- Inventory Check ---
      for (const item of cartItems) {
        const variant = await tx.variant.findUnique({ // Use correct model name
          where: { id: item.variantId },
          select: { inventory: true, product: { select: { name: true } } },
        });
        if (!variant) throw new Error(`Product variant with ID ${item.variantId} not found.`);
        if (variant.inventory < item.quantity) {
          throw new InsufficientInventoryError(
            `Insufficient stock for item: ${variant.product.name} (Variant ID: ${item.variantId}). Required: ${item.quantity}, Available: ${variant.inventory}`
          );
        }
      }
      // --- End Inventory Check ---

      // a. Create Order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PAID,
          shippingAddrId: shippingAddress.id,
          billingAddrId: billingAddress.id, // Use validated billingAddress
        },
      });

      // b. Create Payment Record
      await tx.payment.create({
        data: {
          orderId: order.id,
          status: PaymentStatus.COMPLETED,
          amount: totalAmount,
          provider: "TapPay",
          transactionId: recTradeId,
        },
      });

      // c. Create OrderItems and Deduct Inventory
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.variant.price,
          },
        });
        await tx.variant.update({ // Use correct model name
          where: { id: item.variantId },
          data: { inventory: { decrement: item.quantity } },
        });
      }

      // d. Clear Cart Items
      await tx.cartItem.deleteMany({ where: { cartId: user.cart!.id } });

      return { orderId: order.id };
    });

    orderId = result.orderId; // Assign orderId after successful transaction

    // --- Send Order Confirmation Email (Outside Transaction) ---
    if (orderId) { // Ensure orderId is available
        let orderWithDetails: OrderWithDetails | null = null;
        try {
          orderWithDetails = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: { include: { variant: { include: { product: true } } } },
              payment: true,
              shippingAddr: true, // Correct relation name
              billingAddr: true,  // Correct relation name
              user: { select: { id: true, name: true, email: true } }
            },
          });

          // Check if all necessary details for the email are present
          if (orderWithDetails?.user && orderWithDetails.items && orderWithDetails.shippingAddr && orderWithDetails.payment) {
            // Transform items to match the expected structure for the email service
            const transformedItems = orderWithDetails.items.map(item => ({
              // Copy necessary OrderItem fields (ensure these match OrderItemWithProduct base)
              id: item.id,
              quantity: item.quantity,
              price: item.price, // This should be the price per item at the time of order
              orderId: item.orderId,
              variantId: item.variantId,
              // Create the nested product object expected by the email service
              product: {
                name: item.variant.product.name,
                price: item.variant.product.price, // Or use item.price if that's more appropriate? Check logic. Assuming product price here.
              }
            }));

            // Construct the order data for the email service carefully
            // Cast orderWithDetails to ensure type checker recognizes all fields from the base Order model
            const fullOrderDetails = orderWithDetails as typeof orderWithDetails & { total: Prisma.Decimal, paymentId: string | null, shippingAddrId: string | null, billingAddrId: string | null };

            const orderDataForEmail: OrderConfirmationData['order'] = {
              // Include fields explicitly defined in OrderWithDetails from emailService.ts
              id: fullOrderDetails.id,
              status: fullOrderDetails.status,
              total: fullOrderDetails.total, // Use casted object
              createdAt: fullOrderDetails.createdAt,
              updatedAt: fullOrderDetails.updatedAt,
              userId: fullOrderDetails.userId,
              paymentId: fullOrderDetails.paymentId, // Use casted object
              shippingAddressId: fullOrderDetails.shippingAddrId, // Map from Prisma model field
              billingAddressId: fullOrderDetails.billingAddrId,   // Map from Prisma model field
              // Add the transformed items
              items: transformedItems,
              // Add the mapped shipping address
              shippingAddress: fullOrderDetails.shippingAddr,
              // Add payment details
              payment: fullOrderDetails.payment,
            };


            await sendOrderConfirmationEmail({
              order: orderDataForEmail,
              user: orderWithDetails.user as UserDetails,
            });
            console.log(`Order confirmation email initiated for order ${orderWithDetails.id}`);
          } else {
             console.error(`Could not fetch complete order details (ID: ${orderId}) or required relations for email confirmation.`);
          }
        } catch (emailError) {
          console.error(`Failed to send order confirmation email for order ${orderId}:`, emailError);
        }
    }
    // --- End Email Sending ---

    return { orderId }; // Return the orderId

  } catch (error: unknown) {
    console.error("Prisma transaction failed during order creation:", error);
    if (error instanceof InsufficientInventoryError) {
      throw error;
    } else {
      console.error("Order creation failed post-payment:", error);
      throw new Error("Failed to save order details after successful payment. Please contact support.");
    }
  }
}

// --- API Route Handler ---

// Removed unused RequestHandler type definition

export const POST = withError(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const body = checkoutBodySchema.parse(json);

  try {
    const result = await processCheckout(body, session.user.email);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
     if (error instanceof InsufficientInventoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Let withError handle other errors
    throw error;
  }
});

// Export types for frontend usage
export type CreateOrderBody = CheckoutBody;
export type CreateOrderResponse = { orderId: string };
/// <reference types="node" />
import { Resend } from 'resend';
// Removed unused Product import
import { Order, User, OrderItem, Payment, Address, OrderStatus } from '@prisma/client'; // Added OrderStatus
import { format } from 'date-fns'; // For formatting date
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal

// Initialize Resend client
// Ensure RESEND_API_KEY is set in your environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// --- IMPORTANT ---
// Replace this placeholder with your verified Resend sending domain email.
// Example: 'Your Store <sales@yourverifieddomain.com>'
const FROM_EMAIL = 'Your Store <noreply@yourdomain.com>'; // TODO: Replace with actual verified sender

// Type definition for the data needed by the email function
// Define the structure for an OrderItem with its related Product
type OrderItemWithProduct = OrderItem & { // Use '&' directly
  product: { name: string; price: Decimal }; // Use Decimal for price
};

// Define the structure for the Order including relations
// Define the specific structure needed for the email service order details
interface OrderWithDetails {
  // Include only the fields required by the email template/logic
  id: string;
  status: OrderStatus; // Assuming OrderStatus is imported or globally available
  total: Decimal;
  createdAt: Date;
  updatedAt: Date; // Maybe not needed? Check template
  userId: string; // Maybe not needed? Check template
  paymentId: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  items: OrderItemWithProduct[];
  payment: Payment | null;
  shippingAddress: Address | null;
}

// Define the structure for the User details needed
type UserDetails = {
  name?: string | null;
  email?: string | null;
};

// Combine into the final data structure for the function
export interface OrderConfirmationData { // Added export
  order: OrderWithDetails;
  user: UserDetails;
}

// Interface for the status update email data
interface OrderStatusUpdateData {
  to: string;
  customerName: string | null;
  orderId: string;
  newStatus: string; // Assuming status is a string, adjust if it's an enum
}


// --- Email Sending Functions ---

/**
 * Sends an order confirmation email.
 * @param data Object containing order and user details.
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationData) => {
  const { order, user } = data;
  const to = user.email;

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
  if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
   if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    // Return success=false or throw an error if sending should be blocked
    return { success: false, error: 'FROM_EMAIL not configured' };
   }

  const subject = `Your Cigar Accessories Order #${order.id} Confirmed!`;
  const orderDate = format(new Date(order.createdAt), 'PPP p'); // Format date nicely

  // Helper to format address using correct fields
  const formatAddress = (address: Address | null): string => {
    if (!address) return 'N/A';
    let formatted = address.line1;
    if (address.line2) formatted += `<br>${address.line2}`;
    formatted += `<br>${address.city}, ${address.state} ${address.postal}`; // Use 'postal'
    formatted += `<br>${address.country}`;
    return formatted.trim();
  };

  // Calculate total price from items if payment amount isn't directly available/reliable
  // Add explicit types for reduce parameters
  const calculatedTotal = order.items.reduce((sum: number, item: OrderItemWithProduct) => {
     // Convert Decimal to number for calculation
     const price = item.product.price.toNumber();
     const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
     return sum + (price * quantity);
  }, 0);

  // Use payment amount if available (convert Decimal to number), otherwise use calculated total
  const displayTotal = order.payment?.amount
    ? (order.payment.amount.toNumber()).toFixed(2) // Convert Decimal to number
    : calculatedTotal.toFixed(2);

  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
        h1 { color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Confirmation</h1>
        <p>Hello ${user.name || 'Customer'},</p>
        <p>Thank you for your order! We've received it and will notify you once it ships.</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>

        <h2>Order Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: OrderItemWithProduct) => { // Add explicit type for map parameter
              const price = item.product.price.toNumber(); // Convert Decimal
              const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
              const itemTotal = price * quantity;
              return `
                <tr>
                  <td>${item.product.name || 'N/A'}</td>
                  <td>${quantity}</td>
                  <td>$${price.toFixed(2)}</td>
                  <td>$${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <p class="total">Order Total: $${displayTotal}</p>

        <h2>Shipping Address</h2>
        <p>${formatAddress(order.shippingAddress)}</p>

        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for shopping with Cigar Accessories!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`Attempting to send order confirmation to ${to} from ${FROM_EMAIL}`);
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending order confirmation email to ${to}:`, JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log(`Order confirmation email sent successfully to ${to}. ID: ${emailData?.id}`);
    return { success: true, data: emailData };
  } catch (error) {
    // Catch potential runtime errors during sending
    console.error(`Failed to send order confirmation email to ${to} (runtime error):`, error);
    return { success: false, error };
  }
};

// --- Other existing email functions ---
// (Keep the rest of the functions like sendWelcomeEmail, etc., but ensure they also handle FROM_EMAIL check and Decimal types if applicable)

/**
 * Sends a welcome email to a new user.
 * @param to Recipient email address.
 * @param user User details.
 */
export const sendWelcomeEmail = async (to: string, user: User) => {
   if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
   if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
   if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    return { success: false, error: 'FROM_EMAIL not configured' };
   }

  const subject = `Welcome to Your Store!`;
  const emailBody = `
    <h1>Welcome, ${user.name || 'User'}!</h1>
    <p>Thank you for registering at Your Store.</p>
    <p>Explore our products and enjoy your shopping experience!</p>
    <p><a href="${process.env.NEXTAUTH_URL || '/'}">Visit Store</a></p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending welcome email to ${to}:`, error);
      return { success: false, error };
    }

    console.log(`Welcome email sent successfully to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send welcome email to ${to}:`, error);
    return { success: false, error };
  }
};

/**
 * Sends a password reset request email.
 * @param to Recipient email address.
 * @param resetLink The unique password reset link.
 */
export const sendPasswordResetRequestEmail = async (to: string, resetLink: string) => {
   if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
   if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
   if (!resetLink) {
    console.error('Reset link is missing. Skipping email.');
    return { success: false, error: 'Reset link missing' };
   }
   if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    return { success: false, error: 'FROM_EMAIL not configured' };
   }

  const subject = `Reset Your Password`;
  const emailBody = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending password reset request email to ${to}:`, error);
      return { success: false, error };
    }

    console.log(`Password reset request email sent successfully to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send password reset request email to ${to}:`, error);
    return { success: false, error };
  }
};

/**
 * Sends a password reset confirmation email.
 * @param to Recipient email address.
 */
export const sendPasswordResetConfirmationEmail = async (to: string) => {
   if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
   if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
   if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    return { success: false, error: 'FROM_EMAIL not configured' };
   }

  const subject = `Your Password Has Been Reset`;
  const emailBody = `
    <h1>Password Reset Confirmation</h1>
    <p>Your password has been successfully reset.</p>
    <p>If you did not perform this action, please contact support immediately.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending password reset confirmation email to ${to}:`, error);
      return { success: false, error };
    }

    console.log(`Password reset confirmation email sent successfully to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send password reset confirmation email to ${to}:`, error);
    return { success: false, error };
  }
};


/**
 * Sends a shipping update email.
 * @param to Recipient email address.
 * @param order Order details.
 * @param trackingInfo Tracking information (number, link, carrier).
 */
export const sendShippingUpdateEmail = async (to: string, order: Order, trackingInfo: { trackingNumber?: string; trackingLink?: string; carrier?: string }) => {
   if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
   if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
   if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    return { success: false, error: 'FROM_EMAIL not configured' };
   }

  const subject = `Your Order #${order.id} Has Shipped!`;
  let emailBody = `
    <h1>Order Shipped!</h1>
    <p>Good news! Your order #${order.id} has been shipped.</p>
  `;

  if (trackingInfo.trackingNumber) {
    emailBody += `<p>Tracking Number: ${trackingInfo.trackingNumber}</p>`;
  }
  if (trackingInfo.carrier) {
    emailBody += `<p>Carrier: ${trackingInfo.carrier}</p>`;
  }
  if (trackingInfo.trackingLink) {
    emailBody += `<p><a href="${trackingInfo.trackingLink}">Track Your Order</a></p>`;
  } else if (trackingInfo.trackingNumber) {
    // Basic tracking link guess (adjust per carrier if needed)
    emailBody += `<p>You might be able to track it here: [Generic Tracking Link Placeholder - e.g., UPS/FedEx]</p>`;
  }

  emailBody += `<p>Thank you for shopping with us!</p>`;


  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending shipping update email to ${to}:`, error);
      return { success: false, error };
    }

    console.log(`Shipping update email sent successfully to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send shipping update email to ${to}:`, error);
    return { success: false, error };
  }
};


/**
 * Sends an order status update email to the customer.
 * @param data Object containing email recipient, customer name, order ID, and new status.
 */
export const sendOrderStatusUpdateEmail = async (data: OrderStatusUpdateData) => {
  const { to, customerName, orderId, newStatus } = data;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'; // Base URL for links
  const orderLink = `${siteUrl}/account/orders/${orderId}`;

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
  if (!to) {
    console.error('Recipient email (to) is missing. Skipping email.');
    return { success: false, error: 'Recipient email missing' };
  }
  if (!FROM_EMAIL || FROM_EMAIL.includes('yourdomain.com')) {
    console.warn(`FROM_EMAIL ('${FROM_EMAIL}') is not configured correctly in lib/emailService.ts. Please update it with your verified Resend domain. Skipping email.`);
    return { success: false, error: 'FROM_EMAIL not configured' };
  }

  const subject = `Your Order #${orderId} Status Update`;
  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
        h1 { color: #555; }
        .status { font-weight: bold; font-size: 1.1em; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Status Updated</h1>
        <p>Hello ${customerName || 'Customer'},</p>
        <p>The status of your order <strong>#${orderId}</strong> has been updated.</p>
        <p>New Status: <span class="status">${newStatus}</span></p>
        <p>You can view your order details here:</p>
        <p><a href="${orderLink}">${orderLink}</a></p>
        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for shopping with Cigar Accessories!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`Attempting to send order status update to ${to} from ${FROM_EMAIL}`);
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error(`Error sending order status update email to ${to}:`, JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log(`Order status update email sent successfully to ${to}. ID: ${emailData?.id}`);
    return { success: true, data: emailData };
  } catch (error) {
    console.error(`Failed to send order status update email to ${to} (runtime error):`, error);
    return { success: false, error };
  }
};
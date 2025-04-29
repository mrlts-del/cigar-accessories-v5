# Email Notification System Plan (Using Resend)

## 1. Goal

To implement a reliable email notification system for key e-commerce events using the Resend email service, enhancing customer communication and experience.

## 2. Email Triggers

Emails will be triggered by the following events:

*   **User Registration:** Send a welcome email upon successful account creation.
*   **Order Confirmation:** Send an email immediately after a customer successfully places an order.
*   **Shipping Update:** Send an email when an order's shipping status changes (e.g., shipped, out for delivery). *Requires a mechanism to update order status.*
*   **Password Reset Request:** Send an email containing a password reset link when requested by the user.
*   **Password Reset Confirmation:** Send an email confirming that the password has been successfully reset.

## 3. Email Templates

The following email templates need to be designed and created (either within Resend or as local templates rendered by the application):

*   **Welcome Email:**
    *   **Subject:** Welcome to [Your Store Name]!
    *   **Content:** Warm welcome message, brief store introduction, link to the storefront.
*   **Order Confirmation:**
    *   **Subject:** Your [Your Store Name] Order #[Order ID] Confirmed!
    *   **Content:** Order summary (items, quantities, prices, total), billing/shipping address, estimated delivery timeframe (if available), link to order details page.
*   **Shipping Update:**
    *   **Subject:** Your [Your Store Name] Order #[Order ID] Has Shipped!
    *   **Content:** Confirmation of shipment, tracking number and link (if available), carrier information, estimated delivery date, link to order tracking page.
*   **Password Reset Request:**
    *   **Subject:** Reset Your [Your Store Name] Password
    *   **Content:** Instructions for resetting password, unique and time-limited password reset link, message advising to ignore if the request wasn't made by them.
*   **Password Reset Confirmation:**
    *   **Subject:** Your [Your Store Name] Password Has Been Reset
    *   **Content:** Confirmation that the password was successfully changed, advice on securing their account.

## 4. Backend Integration Points

Email sending logic will be integrated into the following parts of the backend:

*   **User Registration:**
    *   **Location:** Within the NextAuth.js adapter logic or callbacks upon user creation, or potentially in the `POST` handler of `app/api/users/route.ts` if manual registration is implemented separately.
    *   **Action:** Trigger the "Welcome Email".
*   **Order Creation:**
    *   **Location:** `app/api/orders/route.ts` (POST handler).
    *   **Action:** After successfully saving the order to the database, trigger the "Order Confirmation" email.
*   **Shipping Update:**
    *   **Location:** Likely requires modification or creation of an API endpoint for updating order status, potentially `app/api/orders/[id]/status/route.ts` (if used for shipping updates) or a dedicated admin action.
    *   **Action:** When order status is updated to "Shipped" (or similar relevant status), trigger the "Shipping Update" email.
*   **Password Reset:**
    *   **Location:** Requires new API routes, likely under `app/api/auth/password-reset/`.
        *   One route to handle the *request* (generate token, send email).
        *   Another route to handle the *reset* itself (verify token, update password, send confirmation).
    *   **Action:** Trigger "Password Reset Request" and "Password Reset Confirmation" emails accordingly.

## 5. Email Sending Service Utility

*   **Create Utility Module:** Implement a dedicated module, e.g., `lib/emailService.ts` or `lib/resend.ts`.
*   **Encapsulate Logic:** This module will contain functions to interact with the Resend API.
    *   Initialize the Resend client using the API key from environment variables.
    *   Provide functions like `sendOrderConfirmation(orderData)`, `sendWelcomeEmail(userData)`, etc.
    *   These functions will format the required data and call the appropriate Resend API endpoint or SDK method.
*   **Environment Variables:** Add `RESEND_API_KEY` to the `.env` file.

```typescript
// Example structure for lib/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmation = async (to: string, orderDetails: any) => {
  try {
    await resend.emails.send({
      from: 'Your Store <noreply@yourdomain.com>', // Configure your sending domain in Resend
      to: to,
      subject: `Your Order #${orderDetails.id} Confirmed!`,
      // Use React Email components or HTML for the body
      react: <OrderConfirmationEmailTemplate order={orderDetails} />,
      // or html: '<strong>Your order details...</strong>'
    });
    console.log(`Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Add more robust error handling/logging
  }
};

// Add similar functions for other email types...
```

## 6. Validation and Error Handling

*   **Input Validation:** Ensure recipient email addresses are valid before attempting to send.
*   **API Call Handling:** Wrap Resend API calls in `try...catch` blocks.
*   **Logging:** Log successful email sends and any errors encountered. Include relevant information like recipient, email type, and timestamp. Consider using a more structured logging library if needed later.
*   **Feedback:** Provide user feedback where appropriate (e.g., "Password reset instructions sent to your email"). For background tasks like order confirmation, logging is sufficient.
*   **Monitoring:** Monitor Resend dashboard for deliverability rates and issues.

## 7. Actionable Implementation Steps

1.  **Setup Resend:** Create a Resend account, configure and verify a sending domain, and obtain an API key.
2.  **Install SDK:** Add the Resend SDK to the project: `npm install resend` or `yarn add resend`.
3.  **Environment Variable:** Add `RESEND_API_KEY` to `.env` and `.env.example`.
4.  **Create Templates:** Design and implement the email templates (e.g., using React Email if integrating deeply with React components, or directly in Resend).
5.  **Implement Utility:** Create the `lib/emailService.ts` module with functions for each email type.
6.  **Integrate:** Call the utility functions from the specified backend integration points (API routes, NextAuth callbacks).
7.  **Develop Password Reset Flow:** Create the necessary API endpoints and frontend components for password reset.
8.  **Testing:** Thoroughly test each email trigger scenario in a development/staging environment. Verify email content and delivery.
9.  **Deployment:** Ensure environment variables are correctly configured in the production environment.
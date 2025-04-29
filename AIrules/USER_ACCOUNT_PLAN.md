# Plan: User Account Area & Order Tracking

This plan outlines the implementation details for the user account area and order tracking features for the Store Frontend, following the project's established conventions.

## 1. Goals

- Provide users with a dedicated area to manage their profile information (name, email) and shipping/billing addresses.
- Allow users to view their complete order history with key details and pagination.
- Enable users to view detailed information for a specific order, including items, status, addresses, and tracking information (if available).
- Allow users to submit, view, edit, and delete reviews for products they have purchased.
- Ensure a secure, intuitive, and informative user experience consistent with the rest of the application.

## 2. API Endpoints

This section defines the required API endpoints, leveraging existing ones where possible and specifying new ones. All endpoints assume authentication via NextAuth.js session.

### 2.1 User Profile & Addresses

*   **`GET /api/users/me` (New or Adapt `GET /api/users/[id]`)**
    *   **Purpose:** Retrieve the currently authenticated user's profile (id, name, email, image) and associated addresses.
    *   **Auth:** Required.
    *   **Response (200 OK):** User object with an array of address objects.
    *   **Error Handling:** 401 (Unauthorized), 500 (Server Error).

*   **`PATCH /api/users/me` (New or Adapt `PATCH /api/users/[id]`)**
    *   **Purpose:** Update the authenticated user's profile information (e.g., name).
    *   **Auth:** Required.
    *   **Request Body:** `{ "name": "New Name" }`
    *   **Validation:** `name` (required, string).
    *   **Response (200 OK):** Updated user object.
    *   **Error Handling:** 400 (Bad Request/Validation Error), 401 (Unauthorized), 500 (Server Error).

*   **`POST /api/users/me/addresses` (New)**
    *   **Purpose:** Add a new address for the authenticated user.
    *   **Auth:** Required.
    *   **Request Body:** Address object (street, city, state, zip, country, isDefaultShipping?, isDefaultBilling?).
    *   **Validation:** All fields required (except defaults), non-empty strings, zip format.
    *   **Response (201 Created):** Newly created address object with ID.
    *   **Error Handling:** 400 (Bad Request/Validation Error), 401 (Unauthorized), 500 (Server Error).

*   **`PATCH /api/users/me/addresses/{addressId}` (New)**
    *   **Purpose:** Update an existing address for the authenticated user. Can also be used to set default addresses.
    *   **Auth:** Required.
    *   **Request Body:** Partial address object (fields to update).
    *   **Validation:** Validate provided fields. Ensure `addressId` belongs to the user.
    *   **Response (200 OK):** Updated address object.
    *   **Error Handling:** 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden - address doesn't belong to user), 404 (Not Found), 500 (Server Error).

*   **`DELETE /api/users/me/addresses/{addressId}` (New)**
    *   **Purpose:** Delete an address for the authenticated user.
    *   **Auth:** Required.
    *   **Validation:** Ensure `addressId` belongs to the user. Consider preventing deletion if it's the only address or used in active orders.
    *   **Response (204 No Content):** Success.
    *   **Error Handling:** 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

### 2.2 Order History & Tracking

*   **`GET /api/orders/me` (New or Adapt `GET /api/orders`)**
    *   **Purpose:** Retrieve paginated order history for the authenticated user.
    *   **Auth:** Required.
    *   **Query Params:** `page`, `limit`, `sortBy` (optional).
    *   **Response (200 OK):** `{ orders: [...], pagination: {...} }` including basic order details (id, orderNumber, createdAt, totalAmount, status, itemCount).
    *   **Error Handling:** 401 (Unauthorized), 500 (Server Error).

*   **`GET /api/orders/{orderId}` (Existing)**
    *   **Purpose:** Retrieve detailed information for a specific order belonging to the authenticated user.
    *   **Auth:** Required.
    *   **Validation:** Ensure `orderId` belongs to the user.
    *   **Response (200 OK):** Full order details including items, addresses, status, tracking info (number, carrier), and potentially status history.
    *   **Error Handling:** 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

### 2.3 Product Reviews

*   **`POST /api/reviews` (New)**
    *   **Purpose:** Submit a product review for an item purchased by the user.
    *   **Auth:** Required.
    *   **Request Body:** `{ productId, orderId, rating, title?, comment }`
    *   **Validation:** `productId`, `orderId`, `rating` (1-5), `comment` required. Verify user purchased `productId` in `orderId`. Prevent duplicate reviews (per product/order).
    *   **Response (201 Created):** Newly created review object.
    *   **Error Handling:** 400 (Bad Request/Validation/Not Purchased/Already Reviewed), 401 (Unauthorized), 404 (Product/Order Not Found), 500 (Server Error).

*   **`GET /api/reviews/me` (New)**
    *   **Purpose:** Retrieve paginated reviews submitted by the authenticated user.
    *   **Auth:** Required.
    *   **Query Params:** `page`, `limit` (optional).
    *   **Response (200 OK):** `{ reviews: [...], pagination: {...} }` including review details and associated product info (name, image).
    *   **Error Handling:** 401 (Unauthorized), 500 (Server Error).

*   **`PATCH /api/reviews/{reviewId}` (New)**
    *   **Purpose:** Update a review submitted by the authenticated user.
    *   **Auth:** Required.
    *   **Request Body:** Partial review object (`rating`, `title`, `comment`).
    *   **Validation:** Ensure `reviewId` belongs to the user. Validate fields.
    *   **Response (200 OK):** Updated review object.
    *   **Error Handling:** 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

*   **`DELETE /api/reviews/{reviewId}` (New)**
    *   **Purpose:** Delete a review submitted by the authenticated user.
    *   **Auth:** Required.
    *   **Validation:** Ensure `reviewId` belongs to the user.
    *   **Response (204 No Content):** Success.
    *   **Error Handling:** 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

## 3. UI States & Flows

The user account area will reside under the `/account` route, protected by authentication.

```mermaid
graph TD
    subgraph User Account Area (/account)
        direction LR
        Nav[Navigation Menu] --> P[Profile (/account/profile)];
        Nav --> AD[Addresses (/account/addresses)];
        Nav --> OH[Order History (/account/orders)];
        Nav --> R[My Reviews (/account/reviews)];
    end

    subgraph Profile (/account/profile)
        P --> P_View[View Profile Data];
        P --> P_EditBtn[Edit Button];
        P_EditBtn --> P_Form[Edit Profile Form];
        P_Form --> P_Save[Save Action (PATCH /api/users/me)];
    end

    subgraph Addresses (/account/addresses)
        AD --> AD_List[Display Address Cards];
        AD_List --> AD_AddBtn[Add New Address Button];
        AD_List -- per address --> AD_EditBtn[Edit Button];
        AD_List -- per address --> AD_DeleteBtn[Delete Button];
        AD_List -- per address --> AD_SetDefaultBtn[Set Default Button];
        AD_AddBtn --> AD_Form[Add/Edit Address Form (Modal)];
        AD_EditBtn --> AD_Form;
        AD_Form --> AD_Save[Save Action (POST/PATCH /api/users/me/addresses)];
        AD_DeleteBtn --> AD_Confirm[Confirm Delete Modal];
        AD_Confirm --> AD_DeleteAction[Delete Action (DELETE /api/users/me/addresses/{id})];
        AD_SetDefaultBtn --> AD_SetDefaultAction[Set Default Action (PATCH /api/users/me/addresses/{id})];
    end

    subgraph Order History (/account/orders)
        OH --> OH_List[Display Order List (Paginated)];
        OH_List --> OH_Fetch[Fetch Orders (GET /api/orders/me)];
        OH_List -- per order --> OH_DetailsBtn[View Details Button];
        OH_DetailsBtn --> OD[Order Detail Page (/account/orders/{orderId})];
    end

    subgraph Order Detail (/account/orders/{orderId})
        OD --> OD_Fetch[Fetch Order Details (GET /api/orders/{orderId})];
        OD --> OD_Display[Display Details (Status, Total, Items, Addresses, Tracking)];
        OD -- per eligible item --> OD_ReviewBtn[Write Review Button];
        OD_ReviewBtn --> R_Form[Review Form (Modal)];
    end

    subgraph My Reviews (/account/reviews)
        R --> R_List[Display Review List (Paginated)];
        R_List --> R_Fetch[Fetch Reviews (GET /api/reviews/me)];
        R_List -- per review --> R_EditBtn[Edit Button];
        R_List -- per review --> R_DeleteBtn[Delete Button];
        R_EditBtn --> R_Form[Edit Review Form (Modal)];
        R_DeleteBtn --> R_Confirm[Confirm Delete Modal];
        R_Confirm --> R_DeleteAction[Delete Action (DELETE /api/reviews/{id})];
    end

    subgraph Review Form (Modal)
       R_Form --> R_Submit[Submit Action (POST/PATCH /api/reviews)];
    end

    User --> LoginCheck{Logged In?}
    LoginCheck -- Yes --> Nav
    LoginCheck -- No --> LoginPage[/login]
    LoginPage --> Nav
```

**Key UI Components:**
- `AccountLayout`: Wrapper with sidebar/tab navigation.
- `ProfileForm`: Displays and allows editing of user profile.
- `AddressCard`: Displays a single address with edit/delete/default actions.
- `AddressForm`: Modal form for adding/editing addresses.
- `OrderHistoryTable`: Displays paginated list of orders.
- `OrderDetailView`: Displays full details of a single order.
- `ReviewForm`: Modal form for submitting/editing product reviews.
- `ReviewCard`: Displays a single user review with edit/delete actions.
- Reusable components: `LoadingSpinner`, `SkeletonLoader`, `ConfirmModal`, `EmptyStateMessage`.

## 4. Validation & Error Handling

*   **Backend:** Robust validation using Zod in API routes for all inputs. Strict authorization checks ensuring users access only their own data. Centralized error handling (`withError`) returning appropriate HTTP statuses.
*   **Frontend:** Client-side form validation (required fields, formats, ranges) using libraries like `react-hook-form` with Zod resolvers. Graceful handling of API responses (loading, error, success states) managed by React Query. User-friendly error messages via toasts (`useToast`).

## 5. Feedback Mechanisms

*   **Loading:** Skeleton loaders for initial list/page loads; spinners for button actions (save, delete).
*   **Success:** Toasts confirming successful actions (profile update, address added/updated/deleted, review submitted/updated/deleted).
*   **Errors:** Toasts displaying clear error messages from API failures or client-side validation issues. Inline errors on form fields.
*   **Confirmations:** Modals for destructive actions (delete address, delete review).
*   **Empty States:** Informative messages when lists (addresses, orders, reviews) are empty, with potential CTAs.

## 6. Implementation Notes

*   Utilize ShadCN UI components and Tailwind CSS.
*   Use React Query for server state management (fetching, caching, mutations).
*   Use NextAuth.js for authentication context (`useSession`).
*   Implement routing using Next.js App Router.
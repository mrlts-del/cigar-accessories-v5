import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CartItem, CartApiItem } from "./useCartStore";

// API endpoints
const CART_API = "/api/cart";
const CART_MERGE_API = "/api/cart/merge";

// Fetch cart (for logged-in users)
export function useFetchCart(enabled: boolean) {
  return useQuery<CartApiItem[]>( // Pass queryKey and queryFn as separate args
    ["cart"], // queryKey
    async () => { // queryFn
      const res = await fetch(CART_API, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      // Ensure the returned value matches the <CartApiItem[]> type hint
      // Assuming API returns { cart: { ..., items: CartApiItem[] } }
      if (data && data.cart && Array.isArray(data.cart.items)) {
        return data.cart.items;
      }
      // Handle cases where the structure might be different or data is missing
      console.warn("Unexpected cart API response structure:", data);
      return []; // Return empty array as a fallback
    },
    { enabled } // options
  );
}

// Add item to cart (API)
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const res = await fetch(CART_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId, quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add to cart");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Update item quantity (API)
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const res = await fetch(CART_API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId, quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update cart item");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Remove item from cart (API)
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId }: { variantId: string }) => {
      const res = await fetch(CART_API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove cart item");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// Merge guest cart into user cart (on login)
export function useMergeCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { variantId: string; quantity: number }[]) => {
      const res = await fetch(CART_MERGE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to merge cart");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
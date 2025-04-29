import { useEffect, useCallback } from "react";
import type { CartApiItem } from "./useCartStore";
import { useSession } from "next-auth/react";
import { useCartStore, CartItem } from "./useCartStore";
import {
  useFetchCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useMergeCart,
} from "./useCartApi";

// Key for localStorage
const LOCAL_CART_KEY = "guest_cart";

// Util: Load cart from localStorage
function loadLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Util: Save cart to localStorage
function saveLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

// Util: Clear localStorage cart
function clearLocalCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_CART_KEY);
}

// Main cart hook
export interface CartApi {
  id: string;
  items: CartApiItem[];
}

export function useCart() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;

  const { items, addItem, removeItem, clearCart } = useCartStore();

  // React Query hooks
  const fetchCartResult = useFetchCart(isLoggedIn);
  const fetchCart: { data: CartApi | undefined } = {
    data: fetchCartResult.data as CartApi | undefined,
  };
  const addToCartApi = useAddToCart();
  const updateCartItemApi = useUpdateCartItem();
  const removeCartItemApi = useRemoveCartItem();
  const mergeCartApi = useMergeCart();

  // Sync Zustand store with localStorage (for guests)
  useEffect(() => {
    if (!isLoggedIn) {
      const localItems = loadLocalCart();
      useCartStore.setState({ items: localItems });
    }
  }, [isLoggedIn]);

  // Persist to localStorage on change (for guests)
  useEffect(() => {
    if (!isLoggedIn) {
      saveLocalCart(items);
    }
  }, [items, isLoggedIn]);

  // On login: merge local cart to API, then clear local
  useEffect(() => {
    if (isLoggedIn && status === "authenticated") {
      const localItems = loadLocalCart();
      if (localItems.length > 0) {
        // Merge local cart to API
        mergeCartApi.mutate(
          localItems.map((item) => ({
            variantId: item.id,
            quantity: item.quantity,
          })),
          {
            onSuccess: () => {
              clearLocalCart();
              useCartStore.setState({ items: [] });
            },
          }
        );
      }
    }
  }, [isLoggedIn, status]); // eslint-disable-line

  // On logout: clear local cart state
  useEffect(() => {
    if (!isLoggedIn) {
      useCartStore.setState({ items: [] });
    }
  }, [isLoggedIn]);

  // For logged-in users, sync Zustand store with API cart
  useEffect(() => {
    if (isLoggedIn && fetchCart.data) {
      // Map API items to CartItem shape for Zustand
      const mapped = fetchCart.data.items.map((item) => ({
        id: item.variant.product.id, // Map API product ID to CartItem id
        variantId: item.variant.id, // Map API variant ID to CartItem variantId
        name: item.variant.product.name,
        quantity: item.quantity,
        image: item.variant.product.imagePath ?? null,
        price: item.variant.price,
      }));
      useCartStore.setState({ items: mapped });
    }
  }, [isLoggedIn, fetchCart.data]);

  // Unified actions
  const add = useCallback(
    (item: CartItem) => {
      if (isLoggedIn) {
        addToCartApi.mutate({ variantId: item.id, quantity: item.quantity });
      } else {
        addItem(item);
      }
    },
    [isLoggedIn, addToCartApi, addItem]
  );

  const update = useCallback(
    (productId: string, variantId: string, quantity: number) => {
      if (isLoggedIn) {
        updateCartItemApi.mutate({ variantId, quantity }); // API uses variantId to update item
      } else {
        useCartStore.setState((state) => ({
          items: state.items.map((item) =>
            item.id === productId && item.variantId === variantId // Use both productId and variantId to find the item
              ? { ...item, quantity: quantity > 0 ? quantity : 1 } // Ensure quantity is at least 1
              : item
          ),
        }));
      }
    },
    [isLoggedIn, updateCartItemApi]
  );

  const remove = useCallback(
    (productId: string, variantId: string) => {
      if (isLoggedIn) {
        removeCartItemApi.mutate({ variantId }); // API uses variantId to remove item
      } else {
        removeItem(productId, variantId); // Zustand store uses productId and variantId
      }
    },
    [isLoggedIn, removeCartItemApi, removeItem]
  );

  const clear = useCallback(() => {
    if (isLoggedIn) {
      // No API endpoint for clearing all, so remove each item
      if (fetchCart.data) {
        fetchCart.data.items.forEach((item) => {
          removeCartItemApi.mutate({ variantId: item.variantId });
        });
      }
    } else {
      clearCart();
      clearLocalCart();
    }
  }, [isLoggedIn, fetchCart.data, removeCartItemApi, clearCart]);

  // Loading and error states
  const loading =
    addToCartApi.isLoading ||
    updateCartItemApi.isLoading ||
    removeCartItemApi.isLoading ||
    mergeCartApi.isLoading ||
    fetchCartResult.isLoading;

  const error =
    addToCartApi.error ||
    updateCartItemApi.error ||
    removeCartItemApi.error ||
    mergeCartApi.error ||
    fetchCartResult.error;

  return {
    items,
    add,
    update,
    remove,
    clear,
    loading,
    error,
    isLoggedIn,
    apiCart: fetchCart.data, // { id, items }
    cartId: fetchCart.data?.id,
  };
}
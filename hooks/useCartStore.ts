import { create } from "zustand";

export interface CartItem {
  id: string; // Product ID
  variantId: string;
  name: string; // Product name
  quantity: number;
  imagePath?: string | null;
  price?: number; // Price per item of this variant
  size?: string | null;
  color?: string | null;
}

// Matches API response for cart items
export interface CartApiItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    size: string | null;
    color: string | null;
    sku: string;
    inventory: number;
    price: number;
    product: {
      id: string;
      name: string;
      imagePath: string | null; // Changed from image to imagePath
      slug: string;
    };
  };
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateItemQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item: CartItem) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (cartItem) => cartItem.id === item.id && cartItem.variantId === item.variantId
      );

      if (existingItemIndex > -1) {
        // Item with same product and variant exists, update quantity
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += item.quantity;
        return { items: newItems };
      } else {
        // Item does not exist, add it
        return { items: [...state.items, item] };
      }
    }),
  removeItem: (productId: string, variantId: string) =>
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.id === productId && item.variantId === variantId)
      ),
    })),
  updateItemQuantity: (productId: string, variantId: string, quantity: number) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId && item.variantId === variantId
          ? { ...item, quantity: quantity > 0 ? quantity : 1 } // Ensure quantity is at least 1
          : item
      ),
    })),
  clearCart: () => set({ items: [] }),
}));
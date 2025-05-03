import type { Variant } from './product';

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant?: Variant;
}
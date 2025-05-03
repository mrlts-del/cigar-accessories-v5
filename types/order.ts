import { User } from './user';
import { Address } from './address';
import { Variant, Product } from './product';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  variant: Variant;
}

export interface Payment {
  id: string;
  status: string;
  amount: number;
  provider: string;
  transactionId: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  total: number;
  items: OrderItem[];
  user: User;
  payment: Payment | null;
  shippingAddr: Address | null;
  billingAddr: Address | null;
}

export interface OrderItemWithDetails extends OrderItem {
  variant: Variant & { product: Product };
}

export interface DetailedAdminOrder extends Order {
  user: User;
  payment: Payment | null;
  items: OrderItemWithDetails[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
}

export type { User, Address, Variant, Product };
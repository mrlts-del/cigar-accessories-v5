import { Decimal } from '@prisma/client/runtime/library';

export interface Variant {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  sku: string;
  inventory: number;
  price: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  price: Decimal;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  imagePath: string | null;
  basePrice: Decimal;
  salePrice: Decimal | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  variants: Variant[];
}
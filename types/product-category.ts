export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerImageUrl: string | null;
  displayOrder: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
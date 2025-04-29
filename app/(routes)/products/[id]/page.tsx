import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient'; // We will create this next
import { Metadata } from 'next';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

// Optional: Generate metadata dynamically based on the product
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true, description: true } // Only select needed fields for metadata
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} - Cigar Accessories`,
    description: product.description?.substring(0, 160) || `Details for ${product.name}`, // Truncate description for meta
  };
}

const ProductDetailPage = async ({ params }: ProductDetailPageProps) => {
  const productId = params.id;

  // Fetch product details using Prisma
  const product = await prisma.product.findUnique({
    where: { id: productId, deletedAt: null }, // Also ensure not soft-deleted
    include: { // Use include to fetch related variants and other relations
      variants: {
        select: { // Select specific fields from variants if needed
          id: true,
          size: true,
          color: true,
          sku: true,
          inventory: true,
          price: true,
          createdAt: true, // Added to fix type error
          updatedAt: true, // Added to fix type error
          productId: true, // Added to fix type error
        },
        orderBy: { createdAt: 'asc' } // Optional: order variants
      },
      // category: true, // Optionally include category
      reviews: true, // Include reviews if needed
    },
    // Removed select as include is used
  });

  // Handle product not found
  if (!product) {
    notFound(); // Triggers the not-found page
  }

  // TODO: Fetch related products or reviews if implementing optional sections

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetailClient product={product} />
    </div>
  );
};

export default ProductDetailPage;

// Optional: Revalidate data periodically or on-demand if needed
export const revalidate = 3600; // Revalidate every hour
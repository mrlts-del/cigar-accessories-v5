'use client';

import { useState } from 'react';
import { Product, Variant } from '@prisma/client';
import { AdvancedImage } from "@cloudinary/react";
// Removed unused quality import
import Image from 'next/image'; // Import next/image
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast'; // Corrected path
import { useAddToCart } from '@/hooks/useCartApi'; // Import specific hook
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils'; // Assuming a utility for price formatting

// Define the expected props type, including variants
interface ProductDetailClientProps {
  product: Product & { variants: Variant[]; imagePath: string | null }; // Expect variants and explicitly include optional imagePath
  // Add relatedProducts or reviews here if implementing optional sections
}

const ProductDetailClient = ({ product }: ProductDetailClientProps) => {
  // Local helper removed, using imported one now
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { mutateAsync: addItem, isLoading } = useAddToCart(); // Use isLoading instead of isPending

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    } else if (event.target.value === '') {
        setQuantity(1); // Reset to 1 if input is cleared, or handle as needed
    }
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1)); // Prevent quantity < 1

  const handleAddToCart = async () => {
    const firstVariant = product.variants?.[0];

    if (!firstVariant) {
        console.error("No variants found for this product:", product.id);
        toast({
            title: "Error",
            description: "Cannot add this product to cart (missing variant info).",
            variant: "destructive",
        });
        return;
    }

    try {
        // Use variantId now
        await addItem({ variantId: firstVariant.id, quantity });

        toast({
            title: "Success!",
            description: `${product.name} (x${quantity}) added to cart.`,
            // variant: "success", // Optional: if you have variants
        });
        // Optionally: trigger cart drawer open or update header icon state
    } catch (error) {
        console.error("Failed to add item to cart:", error);
        toast({
            title: "Error",
            description: "Failed to add item to cart. Please try again.",
            variant: "destructive",
        });
    }
  };

  // Image display logic using product.imagePath
  const primaryImageUrl = product.imagePath || '/placeholder.png'; // Use placeholder if no imagePath

  // Cloudinary functionality removed as lib/cloudinaryFrontend was deleted.
  // Using next/image fallback directly.
  const cldImage = null; // Explicitly set to null as Cloudinary is not used here

  // Determine stock status (example logic, adjust based on your schema)
  // Stock status (using first variant's inventory - needs proper variant selection UI for accuracy)
  const firstVariantForStock = product.variants?.[0];
  const stockStatus = firstVariantForStock ? (firstVariantForStock.inventory > 0 ? `In Stock (${firstVariantForStock.inventory})` : 'Out of Stock') : 'Availability Unknown';

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start">
        {/* Image Section */}
        <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
           {cldImage ? (
             <AdvancedImage
               cldImg={cldImage}
               alt={product.name}
               className="object-cover w-full h-full"
             />
           ) : (
             // Fallback display using next/image
             <Image src={primaryImageUrl} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
           )}
        </div>

        {/* Details Section */}
        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
            {/* Add category or breadcrumbs here if available */}
          </CardHeader>

          <CardContent className="px-0 space-y-4">
            <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
            <Separator />
            <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <CardDescription>
                {product.description || 'No description available.'}
                </CardDescription>
            </div>
             <Separator />
             <div>
                <h3 className="font-semibold mb-2">Availability</h3>
                <p>{stockStatus}</p> {/* Display stock status */}
             </div>
          </CardContent>

          <CardFooter className="px-0 flex flex-col items-start gap-4">
             <Separator />
             <div className="flex items-center gap-4 w-full">
                <label htmlFor="quantity" className="font-medium">Quantity:</label>
                <div className="flex items-center border rounded-md">
                    <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1 || isLoading}>-</Button>
                    <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-16 text-center border-l border-r rounded-none focus-visible:ring-0"
                        min="1"
                        disabled={isLoading}
                    />
                    <Button variant="outline" size="icon" onClick={incrementQuantity} disabled={isLoading}>+</Button>
                </div>
             </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={isLoading} // Disable button while adding
            >
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default ProductDetailClient;
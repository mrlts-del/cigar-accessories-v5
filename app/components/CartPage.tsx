"use client";
import * as React from "react";
import { useCartStore, CartItem } from "@/hooks/useCartStore"; // Use useCartStore and import CartItem
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Minus, Plus } from "lucide-react"; // Removed Loader2
// Removed Cloudinary imports:
// import { AdvancedImage } from "@cloudinary/react";
// import cld from "@/lib/cloudinaryFrontend";
// import { fill } from "@cloudinary/url-gen/actions/resize";
// import { format } from "@cloudinary/url-gen/actions/delivery";
// import { getPublicIdFromUrl } from "@/lib/utils";
// Removed unused Link import
import clsx from "clsx";
import Image from "next/image"; // Import next/image

export default function CartPage() {
  const cartStore = useCartStore();
  const { items, removeItem, updateItemQuantity, clearCart } = cartStore;
  const { toast } = useToast();

  // Calculate total based on items in the Zustand store
  const total = items.reduce((sum: number, item: CartItem) => sum + (item.price || 0) * item.quantity, 0);

  // Handle quantity change
  const handleQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity < 1) return;
    updateItemQuantity(productId, variantId, quantity);
  };

  // Handle remove
  const handleRemove = (productId: string, variantId: string) => {
    removeItem(productId, variantId);
    toast({ title: "Removed from cart" });
  };

  // Handle clear cart
  const handleClearCart = () => {
    clearCart();
    toast({ title: "Cart cleared" });
  };

  // No need for useEffect with error from useCart hook anymore
  // React.useEffect(() => {
  //   if (error) {
  //     toast.toast({
  //       title: "Cart error",
  //       description: String(error),
  //       variant: "destructive",
  //     });
  //   }
  // }, [error, toast]);

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4">
        {items.map((item: CartItem) => (
          // Use a combined key for items with variants
          <Card key={`${item.id}-${item.variantId}`} className="flex items-center gap-4 p-3">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {/* Use next/image with imagePath */}
              <Image
                src={item.imagePath || "/placeholder.png"} // Use imagePath
                alt={item.name}
                width={80} // Provide explicit width/height
                height={80}
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.name}</div>
               {/* Display variant details */}
              {(item.size || item.color) && (
                 <div className="text-sm text-gray-500">
                   {item.size && `Size: ${item.size}`}
                   {item.size && item.color && ", "}
                   {item.color && `Color: ${item.color}`}
                 </div>
              )}
              <div className="text-sm text-gray-500 mb-1">
                Price: ${item.price?.toFixed(2) || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleQuantity(item.id, item.variantId, item.quantity - 1)}
                  disabled={item.quantity <= 1} // Disable if quantity is 1
                  className="w-8 h-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-2">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleQuantity(item.id, item.variantId, item.quantity + 1)}
                  className="w-8 h-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(item.id, item.variantId)}
              className={clsx("ml-2 text-destructive hover:bg-destructive/10")}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center mt-8 border-t pt-4">
        <div className="text-lg font-semibold">Total: ${total.toFixed(2)}</div>
        <Button variant="outline" onClick={handleClearCart} disabled={items.length === 0}> {/* Use handleClearCart */}
          Clear Cart
        </Button>
      </div>
      {/* Removed "Proceed to Checkout" button as it's out of scope */}
      {/* <div className="mt-6 flex justify-end">
        <Link href="/checkout">
          <Button disabled={items.length === 0}>Proceed to Checkout</Button>
        </Link>
      </div> */}
    </div>
  );
}
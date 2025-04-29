"use client";
import * as React from "react";
import { useCartStore, CartItem } from "hooks/useCartStore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useToast } from "hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import { Trash2, Minus, Plus } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const cartStore = useCartStore();
  const { items, removeItem, updateItemQuantity } = cartStore;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Shopping Cart</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" className="absolute right-2 top-2">×</Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Your cart is empty.</div>
          ) : (
            <div className="space-y-4">
              {items.map((item: CartItem) => (
                // Use a combined key for items with variants
                <Card key={`${item.id}-${item.variantId}`} className="flex items-center gap-4 p-3">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {/* Use next/image with imagePath */}
                    <Image
                      src={item.imagePath || "/placeholder.png"} // Use imagePath
                      alt={item.name}
                      width={64} // Provide explicit width/height
                      height={64}
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
          )}
        </div>
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-lg font-semibold">Subtotal: ${total.toFixed(2)}</div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
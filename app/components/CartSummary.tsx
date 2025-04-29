"use client";
import * as React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "./CartDrawer";
import clsx from "clsx";

export function CartSummary() {
  const { items } = useCart();
  const [open, setOpen] = React.useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Button
        variant="ghost"
        className={clsx("relative p-2")}
        aria-label="Open cart"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
'use client';

import React, { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CartItem } from '@/hooks/useCartStore'; // Import CartItem type from useCartStore

interface OrderSummaryProps {
  items: CartItem[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items }) => {
  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.price === undefined) {
        return acc;
      }
      return acc + item.quantity * item.price;
    }, 0);
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} ({item.quantity})</span>
              <span>{item.price !== undefined ? formatPrice(item.price * item.quantity) : 'N/A'}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-between text-base font-medium">
          <span>Order Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Button disabled={items.length === 0} className="w-full mt-6">
          Proceed to Payment
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
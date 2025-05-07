'use client';

import React, { Suspense } from 'react';
import Container from '@/components/ui/container';
import Heading from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/hooks/useCartStore';
import { useEffect, useState } from 'react';
import OrderSummary from './components/OrderSummary';
import AddressForm from './components/AddressForm';

// TODO: Implement route protection for logged-in users

const CheckoutPageClient = () => {
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCartStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleAddressSelect = () => {
  };

  return (
    <div className="bg-white">
      <Container>
        <div className="px-4 py-16 sm:px-6 lg:px-8">
          <Heading title="Checkout" description="Complete your order" />
          <Separator className="my-6" />
          <div className="lg:grid lg:grid-cols-12 lg:items-start gap-x-12">
            <div className="lg:col-span-7">
              <AddressForm onAddressSelect={handleAddressSelect} />
            </div>
            <div className="mt-16 lg:mt-0 lg:col-span-5">
              <OrderSummary items={cart.items} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

const CheckoutPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageClient />
    </Suspense>
  );
};

export default CheckoutPage;

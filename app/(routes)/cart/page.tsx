import React, { Suspense } from 'react';
import Container from "@/components/ui/container";
import CartPage from "@/app/components/CartPage";

const CartRoutePage = () => {
  return (
    <div className="bg-white">
      <Container>
        <Suspense fallback={<div>Loading cart...</div>}>
          <CartPage />
        </Suspense>
      </Container>
    </div>
  );
};

export default CartRoutePage;
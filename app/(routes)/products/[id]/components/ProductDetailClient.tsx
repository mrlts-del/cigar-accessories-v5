import React from 'react';

interface Product {
  id: string;
  name: string;
  // Add other product properties as needed
}

interface ProductDetailClientProps {
  product: Product;
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = () => {
  return <div>Product Detail Client Component</div>;
};

export default ProductDetailClient;
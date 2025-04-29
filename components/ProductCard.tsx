import Image from "next/image";
import { Heart } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    discount?: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group cursor-pointer rounded-xl border p-3 space-y-4 relative hover:shadow-md transition-shadow">
      {/* Image and Wishlist */}
      <div className="aspect-square rounded-xl bg-gray-100 relative">
        <Image
          src={product.imageUrl}
          alt="Product Image"
          fill
          className="aspect-square object-cover rounded-md"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md">
          <Heart size={20} className="text-gray-500" />
        </div>
      </div>

      {/* Product Info */}
      <div>
        <p className="font-semibold text-lg">{product.name}</p>
        {product.discount && (
          <p className="text-green-600 text-sm">{product.discount}</p>
        )}
        <div className="flex items-center gap-x-2">
          <p className="text-gray-900 font-medium">{product.price}</p>
          {product.originalPrice && (
            <p className="text-gray-500 text-sm line-through">{product.originalPrice}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useImages } from "@/context/ImagesContext";
import { useCart } from "@/context/CartContext";
import { isProductOnSale } from "@/utils/productHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  animationDelay?: number;
}

const ProductCard = ({ product, animationDelay = 0 }: ProductCardProps) => {
  const { images = [] } = useImages();
  const { addToCart } = useCart();
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  const thumbnail = useMemo(() => {
    const id = product?.thumbnailId;
    if (!id || !images || images.length === 0) return null;
    return images.find((img) => img.id === id) || null;
  }, [images, product?.thumbnailId]);

  const src = thumbnail?.url || "/images/image-not-found.png";
  const alt = thumbnail?.alt || thumbnail?.title || product?.title || "";

  const onSale = isProductOnSale(product);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 1500);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col w-full h-full overflow-hidden p-2 rounded-xl bg-white shadow-[0_5px_10px_rgba(16,24,40,0.4)] no-underline opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] transition-[transform_200ms_cubic-bezier(0.34,1.56,0.64,1),box-shadow_200ms_ease] hover:scale-[1.05] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(16,24,40,0.5)] hover:z-1001 focus:scale-[1.03] focus:-translate-y-1 focus:shadow-[0_12px_24px_rgba(16,24,40,0.5)] focus:z-1001"
      title={product.title}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-50">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
          onError={(e) => {
            e.currentTarget.src = "/images/image-not-found.png";
          }}
        />
      </div>
      <p className="py-2 text-base md:text-sm font-bold text-dark whitespace-nowrap overflow-hidden text-ellipsis shrink-0">
        {product.title}
      </p>
      <div className="flex gap-2 items-center justify-between mt-auto">
        {/* Quick Add to Cart Button - shows on hover */}
        <button
          onClick={handleAddToCart}
          className="flex items-center gap-1 bg-primary text-white px-2 py-1 rounded-full text-sm font-bold hover:bg-primary-darker transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Add to cart"
        >
          {showAddedFeedback ? (
            <span>✓ Added!</span>
          ) : (
            <>
              <FontAwesomeIcon icon={faCartPlus} className="text-xs" />
              Add
            </>
          )}
        </button>
        <div className="flex gap-2 items-center">
          {onSale && product.priceOnSale ? (
            <>
              <p className="text-gray-400 font-normal line-through text-sm">
                {product.price},-
              </p>
              <p className="text-dark font-bold bg-yellow px-2 py-1 rounded-full">
                {product.priceOnSale},-
              </p>
            </>
          ) : (
            <p className="text-light font-bold bg-primary px-2 py-1 rounded-full">
              {product.price},-
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

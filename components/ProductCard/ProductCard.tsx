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
      className="group flex flex-col w-full h-full overflow-hidden p-3 gap-2 rounded-xl bg-white border border-gray-100 shadow-sm no-underline opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] transition-[transform_200ms_cubic-bezier(0.34,1.56,0.64,1),box-shadow_200ms_ease,border-color_200ms_ease] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-200 hover:z-1001 focus:scale-[1.02] focus:-translate-y-0.5 focus:shadow-lg focus:border-gray-200 focus:z-1001"
      title={product.title}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-50">
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
        {onSale && (
          <div className="absolute top-2 left-2 z-10 bg-yellow text-dark text-xs font-bold px-2 py-0.5 rounded-full">
            SALE
          </div>
        )}
      </div>

      <p className="text-base md:text-sm font-bold text-dark line-clamp-2 leading-snug min-h-10 shrink-0">
        {product.title}
      </p>

      <div className="flex gap-2 items-center justify-between mt-auto">
        <button
          onClick={handleAddToCart}
          className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-primary-darker transition-colors duration-200"
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

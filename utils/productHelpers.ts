import type { Product } from "@/types/product";

export const isProductOnSale = (
  product: Product | null | undefined,
): boolean => {
  if (!product?.sale?.from || !product?.sale?.to) {
    return false;
  }

  const now = new Date();
  const saleStart = new Date(product.sale.from);
  const saleEnd = new Date(product.sale.to);

  return now >= saleStart && now <= saleEnd;
};

export const isUpcomingSale = (
  product: Product | null | undefined,
): boolean => {
  if (!product?.sale?.from) {
    return false;
  }

  const now = new Date();
  const saleStart = new Date(product.sale.from);

  return now < saleStart;
};

export const isSaleEnded = (product: Product | null | undefined): boolean => {
  if (!product?.sale?.to) {
    return false;
  }

  const now = new Date();
  const saleEnd = new Date(product.sale.to);

  return now > saleEnd;
};

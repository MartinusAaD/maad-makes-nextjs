/**
 * Check if a product is currently on sale based on sale date range
 * @param {Object} product - The product object
 * @returns {boolean} - True if product is currently on sale
 */
export const isProductOnSale = (product) => {
  if (!product?.sale?.from || !product?.sale?.to) {
    return false;
  }

  const now = new Date();
  const saleStart = new Date(product.sale.from);
  const saleEnd = new Date(product.sale.to);

  return now >= saleStart && now <= saleEnd;
};

/**
 * Check if a sale is upcoming (not started yet)
 * @param {Object} product - The product object
 * @returns {boolean} - True if sale is scheduled for the future
 */
export const isUpcomingSale = (product) => {
  if (!product?.sale?.from) {
    return false;
  }

  const now = new Date();
  const saleStart = new Date(product.sale.from);

  return now < saleStart;
};

/**
 * Check if a sale has ended
 * @param {Object} product - The product object
 * @returns {boolean} - True if sale has ended
 */
export const isSaleEnded = (product) => {
  if (!product?.sale?.to) {
    return false;
  }

  const now = new Date();
  const saleEnd = new Date(product.sale.to);

  return now > saleEnd;
};

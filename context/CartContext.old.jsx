"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isProductOnSale } from "@/utils/productHelpers";
import { trackAddToCart, trackRemoveFromCart } from "@/utils/analytics";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const CART_STORAGE_KEY = "maad-makes-cart";
const SHIPPING_COST = 79;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Guard for SSR — localStorage is not available on the server
    if (typeof window === "undefined") return [];
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  // Add item to cart or increase quantity if already exists
  const addToCart = (product, quantity = 1) => {
    trackAddToCart(product, quantity);

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      const onSale = isProductOnSale(product);
      const currentPrice =
        onSale && product.priceOnSale ? product.priceOnSale : product.price;

      return [
        ...prevItems,
        {
          id: product.id,
          title: product.title,
          price: currentPrice,
          originalPrice: product.price,
          isOnSale: onSale,
          thumbnailId: product.thumbnailId,
          slug: product.slug,
          quantity,
        },
      ];
    });
  };

  // Update quantity for specific item
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    const itemToRemove = cartItems.find((item) => item.id === productId);
    if (itemToRemove) {
      trackRemoveFromCart(itemToRemove, itemToRemove.quantity);
    }

    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId),
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate subtotal
  const getSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  // Calculate total with shipping
  const getTotal = () => {
    return getSubtotal() + SHIPPING_COST;
  };

  // Get cart item count
  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal,
    getItemCount,
    shippingCost: SHIPPING_COST,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

import { getAnalytics, logEvent, Analytics } from "firebase/analytics";
import type { Product } from "@/types/product";
import type { OrderItem } from "@/types/order";

let analytics: Analytics | null = null;

const getAnalyticsInstance = (): Analytics | null => {
  if (!analytics) {
    try {
      analytics = getAnalytics();
    } catch (error) {
      console.error("Analytics not available:", error);
    }
  }
  return analytics;
};

export const trackPageView = (
  pageName: string,
  additionalParams: Record<string, unknown> = {},
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "page_view", {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...additionalParams,
    });
  }
};

export const trackProductView = (product: Product): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "view_item", {
      currency: "NOK",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: 1,
        },
      ],
    });
  }
};

export const trackAddToCart = (
  product: Pick<Product, "id" | "title" | "price">,
  quantity = 1,
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "add_to_cart", {
      currency: "NOK",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity,
        },
      ],
    });
  }
};

export const trackRemoveFromCart = (
  product: Pick<Product, "id" | "title" | "price">,
  quantity = 1,
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "remove_from_cart", {
      currency: "NOK",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity,
        },
      ],
    });
  }
};

export const trackBeginCheckout = (
  cartItems: OrderItem[],
  total: number,
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "begin_checkout", {
      currency: "NOK",
      value: total,
      items: cartItems.map((item) => ({
        item_id: item.id,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

export const trackPurchase = (orderData: {
  orderNumber?: number | string;
  total: number;
  shipping: number;
  items: OrderItem[];
}): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "purchase", {
      currency: "NOK",
      transaction_id: orderData.orderNumber?.toString(),
      value: orderData.total,
      shipping: orderData.shipping,
      items: orderData.items.map((item) => ({
        item_id: item.id,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
};

export const trackSearch = (searchTerm: string): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "search", { search_term: searchTerm });
  }
};

export const trackCustomEvent = (
  eventName: string,
  params: Record<string, unknown> = {},
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, eventName, params);
  }
};

export const trackSignUp = (method = "email"): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "sign_up", { method });
  }
};

export const trackLogin = (method = "email"): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "login", { method });
  }
};

export const trackContactFormSubmit = (): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "contact_form_submit");
  }
};

export const trackOrderCancel = (
  orderNumber: number | string,
  reason?: string,
): void => {
  const instance = getAnalyticsInstance();
  if (instance) {
    logEvent(instance, "order_cancel", {
      order_number: orderNumber,
      cancellation_reason: reason || "No reason provided",
    });
  }
};

import { getAnalytics, logEvent } from "firebase/analytics";

// Initialize analytics
let analytics = null;

const getAnalyticsInstance = () => {
  if (!analytics) {
    try {
      analytics = getAnalytics();
    } catch (error) {
      console.error("Analytics not available:", error);
    }
  }
  return analytics;
};

// Track page views
export const trackPageView = (pageName, additionalParams = {}) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "page_view", {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...additionalParams,
    });
  }
};

// Track when user views a product
export const trackProductView = (product) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "view_item", {
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

// Track add to cart
export const trackAddToCart = (product, quantity = 1) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "add_to_cart", {
      currency: "NOK",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  }
};

// Track remove from cart
export const trackRemoveFromCart = (product, quantity = 1) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "remove_from_cart", {
      currency: "NOK",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: quantity,
        },
      ],
    });
  }
};

// Track begin checkout
export const trackBeginCheckout = (cartItems, total) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "begin_checkout", {
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

// Track purchase
export const trackPurchase = (orderData) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "purchase", {
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

// Track search
export const trackSearch = (searchTerm) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "search", {
      search_term: searchTerm,
    });
  }
};

// Track custom events
export const trackCustomEvent = (eventName, params = {}) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, eventName, params);
  }
};

// Track user signup
export const trackSignUp = (method = "email") => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "sign_up", {
      method: method,
    });
  }
};

// Track user login
export const trackLogin = (method = "email") => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "login", {
      method: method,
    });
  }
};

// Track contact form submission
export const trackContactFormSubmit = () => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "contact_form_submit");
  }
};

// Track order cancellation
export const trackOrderCancel = (orderNumber, reason) => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance) {
    logEvent(analyticsInstance, "order_cancel", {
      order_number: orderNumber,
      cancellation_reason: reason || "No reason provided",
    });
  }
};

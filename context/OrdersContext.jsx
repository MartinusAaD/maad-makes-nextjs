"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion,
  Timestamp,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { database, auth } from "@/lib/firestoreConfig";

const OrdersContext = createContext();

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};

// Order statuses
export const ORDER_STATUSES = {
  CANCELLED: "cancelled",
  PENDING: "pending",
  ACTIVE: "active",
  PRINTING: "printing",
  PRINTED: "printed",
  SHIPPED: "shipped",
  COMPLETED: "completed",
};

// Payment methods
export const PAYMENT_METHODS = {
  VIPPS: "vipps",
  FINN: "finn",
  BANK_TRANSFER: "bank transfer",
  CASH: "cash",
  OTHER: "other",
};

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextOrderNumber, setNextOrderNumber] = useState(1);

  // Initialize order counter
  useEffect(() => {
    const initOrderCounter = async () => {
      try {
        const counterRef = doc(database, "metadata", "orderCounter");
        const counterDoc = await getDoc(counterRef);

        if (!counterDoc.exists()) {
          await setDoc(counterRef, { value: 1 });
          setNextOrderNumber(1);
        } else {
          setNextOrderNumber(counterDoc.data().value);
        }
      } catch (error) {
        console.error("Error initializing order counter:", error);
      }
    };

    initOrderCounter();
  }, []);

  // Subscribe to all orders (only when user is authenticated)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const ordersQuery = query(
        collection(database, "orders"),
        orderBy("createdAt", "desc"),
      );

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const ordersData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(ordersData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching orders:", error);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    });

    return () => unsubscribeAuth();
  }, []);

  // Create a new order
  const createOrder = async (orderData) => {
    try {
      let orderNumber;

      if (orderData.isDemo) {
        orderNumber = "DEMO";
      } else {
        const counterRef = doc(database, "metadata", "orderCounter");
        const counterDoc = await getDoc(counterRef);
        orderNumber = counterDoc.exists() ? counterDoc.data().value : 1;
      }

      const order = {
        ...orderData,
        orderNumber,
        ipHash: orderData.ipHash || null,
        status: ORDER_STATUSES.PENDING,
        isPaid: false,
        paymentMethod: null,
        history: [
          {
            field: "order_created",
            value: "Order created",
            timestamp: Timestamp.now(),
          },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(database, "orders"), order);

      if (
        !orderData.isDemo &&
        orderData.items &&
        Array.isArray(orderData.items)
      ) {
        for (const item of orderData.items) {
          if (item.id) {
            try {
              const productRef = doc(database, "products", item.id);
              await updateDoc(productRef, {
                unitsSold: increment(item.quantity || 1),
              });
            } catch (error) {
              console.error(
                `Error updating unitsSold for product ${item.id}:`,
                error,
              );
            }
          }
        }
      }

      if (!orderData.isDemo) {
        const counterRef = doc(database, "metadata", "orderCounter");
        await updateDoc(counterRef, { value: orderNumber + 1 });
        setNextOrderNumber(orderNumber + 1);
      }

      return { id: docRef.id, orderNumber };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  // Update order status
  const updateOrderStatus = async (
    orderId,
    status,
    oldStatus,
    additionalData = {},
  ) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      const historyEntry = {
        field: "status",
        oldValue: oldStatus,
        newValue: status,
        timestamp: Timestamp.now(),
      };

      const updateData = {
        status,
        history: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      await updateDoc(orderRef, updateData);

      const isCancelling =
        status === ORDER_STATUSES.CANCELLED &&
        oldStatus !== ORDER_STATUSES.CANCELLED;
      const isUncancelling =
        oldStatus === ORDER_STATUSES.CANCELLED &&
        status !== ORDER_STATUSES.CANCELLED;

      if (isCancelling || isUncancelling) {
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
              if (item.id) {
                try {
                  const productRef = doc(database, "products", item.id);
                  const incrementValue = isCancelling
                    ? -(item.quantity || 1)
                    : item.quantity || 1;
                  await updateDoc(productRef, {
                    unitsSold: increment(incrementValue),
                  });
                } catch (error) {
                  console.error(
                    `Error updating unitsSold for product ${item.id}:`,
                    error,
                  );
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  };

  // Update payment status
  const updatePaymentStatus = async (
    orderId,
    isPaid,
    paymentMethod = null,
    oldIsPaid,
    oldPaymentMethod,
  ) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      const historyEntry = {
        field: "payment",
        oldValue: `${oldIsPaid ? "Paid" : "Unpaid"}${oldPaymentMethod ? ` (${oldPaymentMethod})` : ""}`,
        newValue: `${isPaid ? "Paid" : "Unpaid"}${paymentMethod ? ` (${paymentMethod})` : ""}`,
        timestamp: Timestamp.now(),
      };

      const updateData = {
        isPaid,
        history: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
      };
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  };

  // Update order notes
  const updateOrderNotes = async (orderId, notes) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      await updateDoc(orderRef, {
        notes,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating order notes:", error);
      throw error;
    }
  };

  // Update customer information
  const updateCustomerInfo = async (orderId, customerInfo, customerNumber) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      const updateData = {
        customer: customerInfo,
        updatedAt: serverTimestamp(),
      };

      if (customerNumber !== undefined) {
        updateData.customerNumber = customerNumber;
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error("Error updating customer info:", error);
      throw error;
    }
  };

  // Update order items
  const updateOrderItems = async (orderId, items, subtotal, savings, total) => {
    try {
      const orderRef = doc(database, "orders", orderId);

      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const currentOrder = orderDoc.data();
        const oldItems = currentOrder.items || [];

        const oldItemsMap = new Map(
          oldItems.map((item) => [item.id, item.quantity || 0]),
        );
        const newItemsMap = new Map(
          items.map((item) => [item.id, item.quantity || 0]),
        );

        const quantityChanges = new Map();

        oldItemsMap.forEach((oldQty, productId) => {
          const newQty = newItemsMap.get(productId) || 0;
          const change = newQty - oldQty;
          if (change !== 0) {
            quantityChanges.set(productId, change);
          }
        });

        newItemsMap.forEach((newQty, productId) => {
          if (!oldItemsMap.has(productId) && newQty > 0) {
            quantityChanges.set(productId, newQty);
          }
        });

        for (const [productId, change] of quantityChanges) {
          if (productId) {
            try {
              const productRef = doc(database, "products", productId);
              await updateDoc(productRef, {
                unitsSold: increment(change),
              });
            } catch (error) {
              console.error(
                `Error updating unitsSold for product ${productId}:`,
                error,
              );
            }
          }
        }
      }

      await updateDoc(orderRef, {
        items,
        subtotal,
        savings,
        total,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating order items:", error);
      throw error;
    }
  };

  // Update shipping
  const updateShipping = async (orderId, shipping, total) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      await updateDoc(orderRef, {
        shipping,
        total,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating shipping:", error);
      throw error;
    }
  };

  // Update tracking code
  const updateTrackingCode = async (
    orderId,
    trackingCode,
    shippingProvider = "posten",
  ) => {
    try {
      const orderRef = doc(database, "orders", orderId);

      const orderDoc = await getDoc(orderRef);
      const currentOrder = orderDoc.data();
      const currentStatus = currentOrder?.status;

      const updateData = {
        trackingCode,
        shippingProvider,
        updatedAt: serverTimestamp(),
      };

      if (currentStatus !== ORDER_STATUSES.SHIPPED) {
        updateData.status = ORDER_STATUSES.SHIPPED;

        const historyEntry = {
          field: "status",
          oldValue: currentStatus,
          newValue: ORDER_STATUSES.SHIPPED,
          timestamp: Timestamp.now(),
        };
        updateData.history = arrayUnion(historyEntry);
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error("Error updating tracking code:", error);
      throw error;
    }
  };

  // Acknowledge order cancellation
  const acknowledgeCancellation = async (orderId) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      await updateDoc(orderRef, {
        cancellationAcknowledged: true,
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error acknowledging cancellation:", error);
      throw error;
    }
  };

  // Get order by ID
  const getOrderById = useCallback(async (orderId) => {
    try {
      const orderRef = doc(database, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        return { id: orderDoc.id, ...orderDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }, []);

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      const orderRef = doc(database, "orders", orderId);

      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();

        if (
          orderData.status !== ORDER_STATUSES.CANCELLED &&
          orderData.items &&
          Array.isArray(orderData.items)
        ) {
          for (const item of orderData.items) {
            if (item.id) {
              try {
                const productRef = doc(database, "products", item.id);
                await updateDoc(productRef, {
                  unitsSold: increment(-(item.quantity || 1)),
                });
              } catch (error) {
                console.error(
                  `Error updating unitsSold for product ${item.id}:`,
                  error,
                );
              }
            }
          }
        }
      }

      await deleteDoc(orderRef);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  };

  const value = {
    orders,
    loading,
    nextOrderNumber,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    updateOrderNotes,
    updateCustomerInfo,
    updateOrderItems,
    updateShipping,
    updateTrackingCode,
    acknowledgeCancellation,
    getOrderById,
    deleteOrder,
  };

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
};

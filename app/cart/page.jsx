"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrdersContext";
import { useImages } from "@/context/ImagesContext";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import Button from "@/components/Button/Button";
import FormFieldset from "@/components/Form/FormFieldset";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextarea";
import FormError from "@/components/Form/FormError";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import {
  trackPageView,
  trackBeginCheckout,
  trackPurchase,
} from "@/utils/analytics";
import {
  getUserIP,
  checkIPRateLimit,
  getRateLimitMessage,
} from "@/utils/rateLimiting";
import useFormValidation from "@/hooks/useFormValidation";

export default function CartPage() {
  const router = useRouter();
  const { images } = useImages();
  const { createOrder } = useOrders();
  const { currentUser, isAdmin } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal,
    shippingCost,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const validationRules = () => ({
    firstName: {
      required: { message: "First name is required" },
      minLength: {
        value: 1,
        message: "First name must be at least 1 characters",
      },
    },
    lastName: {
      required: { message: "Last name is required" },
      minLength: {
        value: 1,
        message: "Last name must be at least 1 characters",
      },
    },
    email: {
      required: { message: "Email is required" },
      email: { message: "Please enter a valid email address" },
    },
    phone: {
      required: { message: "Phone number is required" },
      pattern: {
        value: "^[0-9+\\s()-]{8,}$",
        message: "Please enter a valid phone number",
      },
    },
    address: {
      required: { message: "Address is required" },
      minLength: { value: 1, message: "Address must be at least 1 characters" },
    },
    postalCode: {
      required: { message: "Postal code is required" },
      pattern: { value: "^[0-9]{4}$", message: "Postal code must be 4 digits" },
    },
    city: {
      required: { message: "City is required" },
      minLength: { value: 1, message: "City must be at least 1 characters" },
    },
    comment: {
      maxLength: {
        value: 500,
        message: "Comment must not exceed 500 characters",
      },
    },
  });

  const {
    values: customerInfo,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    setFormValues,
    hasError,
    isSubmitting,
  } = useFormValidation(
    {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      comment: "",
    },
    validationRules,
  );

  useEffect(() => {
    trackPageView("Cart", { cart_size: cartItems.length });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(database, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormValues({
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              phone: userData.phone || "",
              email: currentUser.email || "",
              address: userData.address || "",
              city: userData.city || "",
              postalCode: userData.postalCode || "",
              comment: "",
            });
          } else {
            setFormValues((prev) => ({
              ...prev,
              email: currentUser.email || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [currentUser, setFormValues]);

  const onSubmitOrder = async (data) => {
    setAlert(null);
    trackBeginCheckout(cartItems, getTotal());
    if (cartItems.length === 0) {
      setAlert({ alertMessage: "Your cart is empty", type: "error" });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmPlaceOrder = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      let ipHash;
      if (!currentUser) {
        ipHash = await getUserIP();
        const rateLimit = await checkIPRateLimit(ipHash);
        if (!rateLimit.allowed) {
          setAlert({
            alertMessage: getRateLimitMessage(
              rateLimit.ordersToday,
              rateLimit.limit,
            ),
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      let customerNumber = null;
      if (currentUser) {
        const userDoc = await getDoc(doc(database, "users", currentUser.uid));
        if (userDoc.exists()) customerNumber = userDoc.data().customerNumber;
      }

      let savings = 0;
      cartItems.forEach((item) => {
        if (item.isOnSale && item.originalPrice)
          savings += (item.originalPrice - item.price) * item.quantity;
      });

      const orderData = {
        customer: customerInfo,
        customerNumber,
        ipHash,
        items: cartItems,
        subtotal: getSubtotal(),
        shipping: shippingCost,
        savings,
        total: getTotal(),
        isDemo: demoMode,
      };

      const result = await createOrder(orderData);
      trackPurchase({ ...orderData, orderNumber: result.orderNumber });
      clearCart();

      // Store order data in sessionStorage before navigating (Next.js router can't pass state)
      sessionStorage.setItem(
        "pendingOrderData",
        JSON.stringify({
          orderNumber: result.orderNumber,
          customer: customerInfo,
          items: cartItems,
          subtotal: getSubtotal(),
          shipping: shippingCost,
          savings,
          total: getTotal(),
          isDemo: demoMode,
        }),
      );
      router.push("/order-confirmation");
    } catch (error) {
      console.error("Error creating order:", error);
      setAlert({
        alertMessage: "Failed to place order. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (thumbnailId) => {
    if (!thumbnailId || !images) return null;
    return images.find((img) => img.id === thumbnailId);
  };

  if (cartItems.length === 0) {
    return (
      <div className="py-8 bg-bg-light min-h-screen">
        <ResponsiveWidthWrapper>
          <div className="bg-white p-8 md:p-12 rounded shadow-md text-center">
            <h1 className="text-3xl md:text-4xl text-primary font-bold mb-4">
              Shopping Cart
            </h1>
            <div className="py-12">
              <p className="text-xl md:text-2xl text-gray-600 mb-2">
                Your cart is empty
              </p>
              <p className="text-lg text-gray-500 mb-6">
                Add some products to get started!
              </p>
              <Button onClick={() => router.push("/store")}>Go to Store</Button>
            </div>
          </div>
        </ResponsiveWidthWrapper>
      </div>
    );
  }

  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="bg-white p-4 md:p-8 rounded shadow-md">
          <h1 className="text-3xl md:text-4xl text-primary font-bold mb-6">
            Shopping Cart
          </h1>

          {alert && (
            <div className="mb-6">
              <Alert alertMessage={alert.alertMessage} type={alert.type} />
            </div>
          )}

          {showConfirmDialog && (
            <AlertDialog
              title={demoMode ? "Confirm Demo Order" : "Confirm Order"}
              alertMessage={
                demoMode
                  ? `You are about to place a DEMO order for ${cartItems.length} item${cartItems.length > 1 ? "s" : ""} totaling ${getTotal().toFixed(2)} kr. This is a demo order for portfolio purposes only and will not result in an actual purchase.`
                  : `You are about to place an order for ${cartItems.length} item${cartItems.length > 1 ? "s" : ""} totaling ${getTotal().toFixed(2)} kr. You will be contacted regarding payment and estimated completion time.`
              }
              onConfirm={confirmPlaceOrder}
              onCancel={() => setShowConfirmDialog(false)}
            />
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark">Items in Cart</h2>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear Cart
              </button>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => {
                const image = getItemImage(item.thumbnailId);
                const imgSrc =
                  image?.url ||
                  image?.downloadURL ||
                  "/images/image-not-found.png";
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded"
                  >
                    <Link
                      href={`/product/${item.slug}`}
                      className="flex-shrink-0"
                    >
                      <img
                        src={imgSrc}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/image-not-found.png";
                        }}
                      />
                    </Link>
                    <div className="flex-grow">
                      <Link
                        href={`/product/${item.slug}`}
                        className="text-lg font-bold text-dark hover:text-primary no-underline"
                      >
                        {item.title}
                      </Link>
                      {item.isOnSale ? (
                        <div className="flex items-center gap-2">
                          <p className="text-gray-400 line-through text-sm">
                            {item.originalPrice}kr
                          </p>
                          <p className="text-dark font-semibold px-2 py-0.5 rounded">
                            {item.price}kr each
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600">{item.price}kr each</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                          disabled={item.quantity <= 1}
                        >
                          <FontAwesomeIcon icon={faMinus} className="text-xs" />
                        </button>
                        <span className="text-lg font-semibold w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        {item.isOnSale && (
                          <p className="text-sm text-gray-400 line-through">
                            {item.originalPrice * item.quantity}kr
                          </p>
                        )}
                        <p
                          className={`text-lg font-bold ${item.isOnSale ? "text-primary" : "text-dark"}`}
                        >
                          {item.price * item.quantity}kr
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove from cart"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">{getSubtotal()}kr</span>
              </div>
              {cartItems.some((item) => item.isOnSale) && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span className="font-semibold">Savings:</span>
                  <span className="font-semibold">
                    -
                    {cartItems.reduce(
                      (total, item) =>
                        item.isOnSale
                          ? total +
                            (item.originalPrice - item.price) * item.quantity
                          : total,
                      0,
                    )}
                    kr
                  </span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Shipping:</span>
                <span className="font-semibold">{shippingCost}kr</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-primary">{getTotal()}kr</span>
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              📦 <strong>Note:</strong> Shipping is only available within
              Norway.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmitOrder)} noValidate>
            {!currentUser && (
              <div className="mb-6 p-4 border-2 border-primary-lighter/50 rounded">
                <p className="text-sm">
                  <strong>Tip:</strong>{" "}
                  <Link
                    href="/login"
                    className="text-primary-lighter hover:text-primary-darker underline font-semibold"
                  >
                    Log In
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/login"
                    className="text-primary-lighter hover:text-primary-darker underline font-semibold"
                  >
                    Create an account
                  </Link>{" "}
                  to track your orders and save your information for future
                  purchases!
                </p>
              </div>
            )}

            <FormFieldset legend="Customer/Shipping Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <FormLabel htmlFor="firstName">First Name *</FormLabel>
                  <FormInput
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={customerInfo.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="John"
                    error={hasError("firstName")}
                  />
                  <FormError error={errors.firstName} />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="lastName">Last Name *</FormLabel>
                  <FormInput
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={customerInfo.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Doe"
                    error={hasError("lastName")}
                  />
                  <FormError error={errors.lastName} />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="email">Email *</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="john.doe@example.com"
                    error={hasError("email")}
                  />
                  <FormError error={errors.email} />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="phone">Phone Number *</FormLabel>
                  <FormInput
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="91234567"
                    error={hasError("phone")}
                  />
                  <FormError error={errors.phone} />
                </FormGroup>
                <FormGroup className="md:col-span-2">
                  <FormLabel htmlFor="address">Address *</FormLabel>
                  <FormInput
                    type="text"
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Adresseveien 123c"
                    error={hasError("address")}
                  />
                  <FormError error={errors.address} />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="postalCode">Postal Code *</FormLabel>
                  <FormInput
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={customerInfo.postalCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0123"
                    error={hasError("postalCode")}
                  />
                  <FormError error={errors.postalCode} />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="city">City *</FormLabel>
                  <FormInput
                    type="text"
                    id="city"
                    name="city"
                    value={customerInfo.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Oslo"
                    error={hasError("city")}
                  />
                  <FormError error={errors.city} />
                </FormGroup>
                <FormGroup className="md:col-span-2">
                  <FormLabel htmlFor="comment">
                    Order Comments (Optional)
                  </FormLabel>
                  <FormTextarea
                    id="comment"
                    name="comment"
                    value={customerInfo.comment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Any special requests or comments about your order..."
                    rows={4}
                    maxLength={500}
                    error={hasError("comment")}
                  />
                  <FormError error={errors.comment} />
                  <p className="text-sm text-gray-500 mt-1 text-right">
                    {customerInfo.comment.length} / 500 characters
                  </p>
                </FormGroup>
              </div>
            </FormFieldset>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-dark">Demo Mode</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable this if you want to test the ordering process without
                    placing a real order. Demo orders are visible in your order
                    history if placed with an account.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex gap-4">
              <Button type="button" onClick={() => router.push("/store")}>
                Continue Shopping
              </Button>
              <Button type="submit" disabled={loading || isSubmitting}>
                {loading
                  ? demoMode
                    ? "Placing Demo Order..."
                    : "Placing Order..."
                  : demoMode
                    ? "Place Demo Order"
                    : "Place Order"}
              </Button>
            </div>
          </form>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

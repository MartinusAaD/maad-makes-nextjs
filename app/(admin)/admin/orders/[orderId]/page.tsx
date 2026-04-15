"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import {
  useOrders,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from "@/context/OrdersContext";
import { useImages } from "@/context/ImagesContext";
import { useProducts } from "@/context/ProductsContext";
import { isProductOnSale } from "@/utils/productHelpers";
import type {
  Order,
  OrderItem,
  OrderCustomer,
  OrderStatus,
  PaymentMethod,
} from "@/types/order";

type AlertType = "info" | "success" | "error" | "warning";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import Button from "@/components/Button/Button";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormTextarea from "@/components/Form/FormTextarea";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBox,
  faUser,
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faMoneyBillWave,
  faCalendar,
  faEdit,
  faSave,
  faTimes,
  faHistory,
  faCircle,
  faCommentDots,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const {
    getOrderById,
    updateOrderStatus,
    updateOrderNotes,
    updateCustomerInfo,
    updateOrderItems,
    updateShipping,
    updateTrackingCode,
    deleteOrder,
  } = useOrders();
  const { images } = useImages();
  const { products } = useProducts();

  const getImageUrl = (thumbnailId: string | undefined): string => {
    if (!thumbnailId || !images) return "/images/image-not-found.png";
    if (thumbnailId === "__placeholder__") return "/images/image-not-found.png";
    const image = images.find((img) => img.id === thumbnailId);
    return image?.url || "/images/image-not-found.png";
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("pending");
  const [isPaid, setIsPaid] = useState(false);
  const [isRefunded, setIsRefunded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [notes, setNotes] = useState("");
  const [alert, setAlert] = useState<{
    type: AlertType;
    alertMessage: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState<OrderCustomer>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [customerNumber, setCustomerNumber] = useState<number | null>(null);
  const [editingItems, setEditingItems] = useState(false);
  const [itemsForm, setItemsForm] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingProvider, setShippingProvider] = useState("posten");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderById(orderId);
        if (orderData) {
          setOrder(orderData);
          setSelectedStatus(orderData.status);
          setIsPaid(orderData.isPaid);
          setIsRefunded(orderData.isRefunded || false);
          setPaymentMethod(orderData.paymentMethod || null);
          setNotes(orderData.notes || "");
          setCustomerNumber(orderData.customerNumber || null);
          setShippingPrice(orderData.shipping || 0);
          setTrackingCode(orderData.trackingCode || "");
          setShippingProvider(orderData.shippingProvider || "posten");
          if (orderData.customer) {
            setCustomerForm(orderData.customer);
          }
          if (orderData.items) {
            setItemsForm(orderData.items);
          }
        } else {
          setAlert({ type: "error", alertMessage: "Order not found" });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setAlert({ type: "error", alertMessage: "Failed to load order" });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getOrderById]);

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const statusDirty = selectedStatus !== order.status;
      const paymentDirty =
        isPaid !== order.isPaid ||
        isRefunded !== (order.isRefunded || false) ||
        paymentMethod !== (order.paymentMethod || "");
      const trackingDirty =
        trackingCode !== (order.trackingCode || "") ||
        shippingProvider !== (order.shippingProvider || "posten");
      const notesDirty = notes !== (order.notes || "");

      if (!statusDirty && !paymentDirty && !trackingDirty && !notesDirty) {
        setAlert({ type: "info", alertMessage: "No changes to save" });
        return;
      }

      if (paymentDirty) {
        const orderRef = doc(database, "orders", orderId);
        const historyEntry = {
          field: "payment",
          oldValue: `${order.isPaid ? "Paid" : "Unpaid"}${order.isRefunded ? " (Refunded)" : ""}${order.paymentMethod ? ` (${order.paymentMethod})` : ""}`,
          newValue: `${isPaid ? "Paid" : "Unpaid"}${isRefunded ? " (Refunded)" : ""}${paymentMethod ? ` (${paymentMethod})` : ""}`,
          timestamp: Timestamp.now(),
        };
        await updateDoc(orderRef, {
          isPaid,
          isRefunded,
          paymentMethod: paymentMethod || null,
          updatedAt: serverTimestamp(),
          history: arrayUnion(historyEntry),
        });
      }

      if (notesDirty) {
        await updateOrderNotes(orderId, notes);
      }

      if (trackingDirty) {
        await updateTrackingCode(orderId, trackingCode, shippingProvider);
      }

      if (statusDirty) {
        await updateOrderStatus(orderId, selectedStatus, order.status);
      }

      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
      setSelectedStatus(updatedOrder.status);
      setAlert({ type: "success", alertMessage: "Changes saved" });
    } catch (error) {
      console.error("Error saving changes:", error);
      setAlert({ type: "error", alertMessage: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerUpdate = async () => {
    try {
      setSaving(true);
      await updateCustomerInfo(orderId, customerForm, customerNumber);
      setAlert({
        type: "success",
        alertMessage: "Customer information updated",
      });
      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
      setCustomerNumber(updatedOrder.customerNumber || null);
      setEditingCustomer(false);
    } catch (error) {
      console.error("Error updating customer info:", error);
      setAlert({
        type: "error",
        alertMessage: "Failed to update customer information",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (order.customer) {
      setCustomerForm(order.customer);
    }
    setCustomerNumber(order.customerNumber || null);
    setEditingCustomer(false);
  };

  const handleItemsUpdate = async () => {
    try {
      setSaving(true);
      const subtotal = itemsForm.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const savings = itemsForm.reduce((sum, item) => {
        if (item.isOnSale && item.originalPrice) {
          return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
      }, 0);
      const shipping = order.shipping !== undefined ? order.shipping : 79;
      const total = subtotal + shipping;

      await updateOrderItems(orderId, itemsForm, subtotal, savings, total);
      setAlert({ type: "success", alertMessage: "Order items updated" });
      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
      setEditingItems(false);
    } catch (error) {
      console.error("Error updating items:", error);
      setAlert({ type: "error", alertMessage: "Failed to update order items" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelItemsEdit = () => {
    if (order.items) {
      setItemsForm(order.items);
    }
    setEditingItems(false);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...itemsForm];
    const item = updatedItems[index] as unknown as Record<string, unknown>;
    if (
      field === "quantity" ||
      field === "price" ||
      field === "originalPrice"
    ) {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }
    setItemsForm(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = itemsForm.filter((_, i) => i !== index);
    setItemsForm(updatedItems);
  };

  const handleAddProduct = (product) => {
    const existingIndex = itemsForm.findIndex((item) => item.id === product.id);
    if (existingIndex !== -1) {
      const updatedItems = [...itemsForm];
      updatedItems[existingIndex].quantity += 1;
      setItemsForm(updatedItems);
    } else {
      const onSale = isProductOnSale(product);
      const regularPrice = product.price || 0;
      const newItem: OrderItem = {
        id: product.id,
        title: product.title,
        slug: product.slug || "",
        price: onSale ? product.priceOnSale || regularPrice : regularPrice,
        originalPrice: regularPrice,
        quantity: 1,
        thumbnailId:
          product.thumbnailImageId ||
          product.thumbnailId ||
          (product.isTempFill ? "__placeholder__" : ""),
        isOnSale: onSale,
      };
      setItemsForm([...itemsForm, newItem]);
    }
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const filteredProducts = products
    .filter(
      (product) =>
        product.title?.toLowerCase().includes(productSearch.toLowerCase()) &&
        (product.isActive !== false || product.isTempFill === true),
    )
    .slice(0, 10);

  const handleDeleteOrder = async () => {
    try {
      setSaving(true);
      const orderNumber = order.orderNumber;
      await deleteOrder(orderId);
      sessionStorage.setItem(
        "ordersFlashMessage",
        JSON.stringify({
          message: `Order #${orderNumber} deleted successfully`,
          type: "success",
        }),
      );
      router.push("/admin/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      setAlert({ type: "error", alertMessage: "Failed to delete order" });
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (timestamp: Timestamp): string => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <ResponsiveWidthWrapper>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">Loading order...</p>
        </div>
      </ResponsiveWidthWrapper>
    );
  }

  if (!order) {
    return (
      <ResponsiveWidthWrapper>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">Order not found</p>
          <Button onClick={() => router.push("/admin/orders")} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </ResponsiveWidthWrapper>
    );
  }

  return (
    <ResponsiveWidthWrapper>
      <div className="py-8">
        {alert && (
          <Alert
            type={alert.type}
            alertMessage={alert.alertMessage}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/admin/orders")}
            className="mb-4 bg-gray-600! hover:bg-gray-700!"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.orderNumber}
            {order.isDemo && (
              <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-base font-medium text-blue-700">
                🎭 Demo Order
              </span>
            )}
          </h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} />
              Ordered: {formatDate(order.createdAt)}
            </span>
            {order.updatedAt && (
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} />
                Updated: {formatDate(order.updatedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2">
            {/* Order Items */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <FontAwesomeIcon icon={faBox} />
                  Order Items
                </h2>
                {!editingItems && order.items && order.items.length > 0 && (
                  <button
                    onClick={() => setEditingItems(true)}
                    className="text-primary hover:text-primary-darker transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </button>
                )}
              </div>
              {order.items && order.items.length > 0 ? (
                editingItems ? (
                  <div className="space-y-4">
                    {itemsForm.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                      >
                        <NextImage
                          src={getImageUrl(item.thumbnailId)}
                          alt={item.title}
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-md border border-gray-200 object-cover"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement>,
                          ) => {
                            e.currentTarget.src = "/images/image-not-found.png";
                          }}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove item"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <FormLabel htmlFor={`quantity-${index}`}>
                                Quantity
                              </FormLabel>
                              <FormInput
                                type="number"
                                id={`quantity-${index}`}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                min="1"
                              />
                            </div>
                            <div>
                              <FormLabel htmlFor={`price-${index}`}>
                                Price (kr)
                              </FormLabel>
                              <FormInput
                                type="number"
                                id={`price-${index}`}
                                value={item.price}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "price",
                                    e.target.value,
                                  )
                                }
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <FormLabel htmlFor={`original-${index}`}>
                                Original Price
                              </FormLabel>
                              <FormInput
                                type="number"
                                id={`original-${index}`}
                                value={item.originalPrice || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "originalPrice",
                                    e.target.value,
                                  )
                                }
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                          <div className="text-sm">
                            {item.originalPrice &&
                            item.originalPrice > item.price ? (
                              <div className="space-y-1">
                                <span className="text-gray-600">
                                  Subtotal:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {item.price * item.quantity}kr
                                  </span>
                                </span>
                                <div className="text-xs text-green-600">
                                  Total saved:{" "}
                                  {(item.originalPrice - item.price) *
                                    item.quantity}
                                  kr
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-600">
                                Subtotal:{" "}
                                <span className="font-semibold">
                                  {item.price * item.quantity}kr
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Product Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Add Product to Order
                      </h4>
                      <div className="relative">
                        <FormInput
                          type="text"
                          placeholder="Search products by name..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(e.target.value.length > 0);
                          }}
                          onFocus={() =>
                            setShowProductDropdown(productSearch.length > 0)
                          }
                        />
                        {showProductDropdown && productSearch && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleAddProduct(product)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                                >
                                  <NextImage
                                    src={getImageUrl(product.thumbnailId)}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover rounded border border-gray-200"
                                    onError={(
                                      e: React.SyntheticEvent<HTMLImageElement>,
                                    ) => {
                                      e.currentTarget.src =
                                        "/images/image-not-found.png";
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {product.title}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {product.price}kr
                                    </div>
                                  </div>
                                  <FontAwesomeIcon
                                    icon={faPlus}
                                    className="text-primary"
                                  />
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                No products found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={handleItemsUpdate}
                        disabled={saving}
                        className="flex-1"
                      >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancelItemsEdit}
                        disabled={saving}
                        className="flex-1 bg-gray-600! hover:bg-gray-700!"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                      >
                        <NextImage
                          src={getImageUrl(item.thumbnailId)}
                          alt={item.title}
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-md border border-gray-200 object-cover"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement>,
                          ) => {
                            e.currentTarget.src = "/images/image-not-found.png";
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                          <div className="mt-2">
                            {item.originalPrice &&
                            item.originalPrice > item.price ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 line-through">
                                    {item.originalPrice}kr
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {item.price}kr
                                  </span>
                                </div>
                                <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Save {item.originalPrice - item.price}kr per
                                  item
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-900">
                                {item.price}kr
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {item.price * item.quantity}kr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-gray-500">No items in this order</p>
              )}

              {/* Order Summary */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{order.subtotal}kr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping:</span>
                    {editingItems ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={shippingPrice}
                          onChange={(e) =>
                            setShippingPrice(Number(e.target.value))
                          }
                          onBlur={async () => {
                            const newTotal = order.subtotal + shippingPrice;
                            try {
                              await updateShipping(
                                order.id,
                                shippingPrice,
                                newTotal,
                              );
                              const updatedOrder = await getOrderById(order.id);
                              setOrder(updatedOrder);
                              setAlert({
                                type: "success",
                                alertMessage: "Shipping updated",
                              });
                            } catch (error) {
                              console.error("Error updating shipping:", error);
                              setAlert({
                                type: "error",
                                alertMessage: "Failed to update shipping",
                              });
                            }
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                          min="0"
                          step="1"
                        />
                        <span className="text-sm text-gray-500">kr</span>
                      </div>
                    ) : (
                      <span className="font-medium">{order.shipping}kr</span>
                    )}
                  </div>
                  {order.savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Savings:</span>
                      <span className="font-medium">-{order.savings}kr</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{order.total}kr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Comments */}
            {order.customer?.comment && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
                  <FontAwesomeIcon icon={faCommentDots} />
                  Customer Comments
                </h2>
                <p className="text-gray-900 bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                  {order.customer.comment}
                </p>
              </div>
            )}

            {/* Customer Information */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <FontAwesomeIcon icon={faUser} />
                  Customer Information
                </h2>
                {!editingCustomer && order.customer && (
                  <button
                    onClick={() => setEditingCustomer(true)}
                    className="text-primary hover:text-primary-darker transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </button>
                )}
              </div>
              {order.customer ? (
                editingCustomer ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormLabel htmlFor="firstName">First Name</FormLabel>
                        <FormInput
                          type="text"
                          id="firstName"
                          value={customerForm.firstName}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <FormLabel htmlFor="lastName">Last Name</FormLabel>
                        <FormInput
                          type="text"
                          id="lastName"
                          value={customerForm.lastName}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormInput
                        type="email"
                        id="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <FormLabel htmlFor="phone">Phone</FormLabel>
                      <FormInput
                        type="tel"
                        id="phone"
                        value={customerForm.phone}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <FormLabel htmlFor="address">Address</FormLabel>
                      <FormInput
                        type="text"
                        id="address"
                        value={customerForm.address}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
                        <FormInput
                          type="text"
                          id="postalCode"
                          value={customerForm.postalCode}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              postalCode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <FormLabel htmlFor="city">City</FormLabel>
                        <FormInput
                          type="text"
                          id="city"
                          value={customerForm.city}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <FormLabel htmlFor="customerNumber">
                        Customer Number
                      </FormLabel>
                      <FormInput
                        type="number"
                        id="customerNumber"
                        value={customerNumber || ""}
                        onChange={(e) =>
                          setCustomerNumber(
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        placeholder="Optional"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Link this order to a specific customer account
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCustomerUpdate}
                        disabled={saving}
                        className="flex-1"
                      >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 bg-gray-600! hover:bg-gray-700!"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name:</p>
                      <p className="text-gray-900">
                        {order.customer.firstName} {order.customer.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-gray-400"
                      />
                      <a
                        href={`mailto:${order.customer.email}`}
                        className="text-primary hover:underline"
                      >
                        {order.customer.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-gray-400"
                      />
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="text-primary hover:underline"
                      >
                        {order.customer.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="mt-1 text-gray-400"
                      />
                      <div>
                        <p className="text-gray-900">
                          {order.customer.address}
                        </p>
                        <p className="text-gray-900">
                          {order.customer.postalCode} {order.customer.city}
                        </p>
                      </div>
                    </div>
                    {order.customerNumber && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Customer Number:
                        </p>
                        <p className="text-gray-900">{order.customerNumber}</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p className="text-gray-500">
                  No customer information available
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FontAwesomeIcon icon={faMoneyBillWave} />
                Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <FormLabel htmlFor="paymentStatus">Payment Status</FormLabel>
                  <FormSelect
                    id="paymentStatus"
                    value={
                      isRefunded
                        ? "refunded"
                        : paymentMethod === "free"
                          ? "free"
                          : isPaid
                            ? "paid"
                            : "unpaid"
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "refunded") {
                        setIsPaid(true);
                        setIsRefunded(true);
                        setPaymentMethod(null);
                      } else if (value === "free") {
                        setIsPaid(true);
                        setIsRefunded(false);
                        setPaymentMethod("free");
                      } else {
                        setIsRefunded(false);
                        setIsPaid(value === "paid");
                        if (value === "unpaid") {
                          setPaymentMethod(null);
                        } else if (paymentMethod === "free") {
                          setPaymentMethod(null);
                        }
                      }
                    }}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="free">Free</option>
                  </FormSelect>
                </div>
                {isPaid && paymentMethod !== "free" && !isRefunded && (
                  <div>
                    <FormLabel htmlFor="paymentMethod">
                      Payment Method
                    </FormLabel>
                    <FormSelect
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                    >
                      <option value="">Select method</option>
                      {Object.values(PAYMENT_METHODS).map((method) => (
                        <option key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                )}
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Order Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Order Status
              </h2>
              <div className="space-y-4">
                <div>
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <FormSelect
                    id="status"
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as OrderStatus)
                    }
                  >
                    {Object.values(ORDER_STATUSES).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Tracking Code */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tracking / Shipping Code
                </h2>
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Visible to customer
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <FormLabel htmlFor="shippingProvider">
                    Shipping Provider
                  </FormLabel>
                  <FormSelect
                    id="shippingProvider"
                    value={shippingProvider}
                    onChange={(e) => setShippingProvider(e.target.value)}
                  >
                    <option value="posten">Posten</option>
                    <option value="postnord">PostNord</option>
                    <option value="helthjem">Helt Hjem</option>
                  </FormSelect>
                </div>
                <div>
                  <FormLabel htmlFor="trackingCode">Tracking Code</FormLabel>
                  <FormInput
                    id="trackingCode"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Enter tracking number or shipping code..."
                  />
                  {order.shippedEmailSent && (
                    <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1 mt-2">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Shipping email sent
                    </p>
                  )}
                  {!order.shippedEmailSent && order.status !== "shipped" && (
                    <p className="text-xs text-blue-600 mt-2">
                      Saving will mark order as shipped and send email to
                      customer
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Notes
                </h2>
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Visible to customer
                </p>
              </div>
              <div className="space-y-4">
                <FormTextarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this order..."
                  rows={4}
                />
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Order History */}
            {order.history && order.history.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FontAwesomeIcon icon={faHistory} />
                  Order History
                </h2>
                <div className="space-y-4">
                  {[...order.history].reverse().map((entry, index) => (
                    <div key={index} className="relative pl-6 pb-4 last:pb-0">
                      {index < order.history.length - 1 && (
                        <div className="absolute left-1.75 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-1">
                        <FontAwesomeIcon
                          icon={faCircle}
                          className="text-xs text-primary"
                        />
                      </div>
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {entry.field === "order_created"
                                ? entry.value
                                : `${entry.field} Updated`}
                            </p>
                            {entry.oldValue && entry.newValue && (
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="line-through">
                                  {entry.oldValue}
                                </span>
                                {" → "}
                                <span className="font-medium text-primary">
                                  {entry.newValue}
                                </span>
                              </p>
                            )}
                          </div>
                          <time className="text-xs text-gray-500 whitespace-nowrap">
                            {entry.timestamp && formatDate(entry.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Order Button */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-red-900">
                Danger Zone
              </h2>
              <p className="mb-4 text-sm text-red-700">
                Deleting this order is permanent and cannot be undone. All order
                data will be lost.
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving}
                className="bg-red-600! hover:bg-red-700! w-full"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <AlertDialog
          title="Delete Order"
          message={`Are you sure you want to delete order #${order.orderNumber}? This action cannot be undone and all order data will be permanently lost.`}
          onConfirm={handleDeleteOrder}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </ResponsiveWidthWrapper>
  );
}

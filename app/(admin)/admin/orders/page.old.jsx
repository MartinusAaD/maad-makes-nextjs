"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useOrders, ORDER_STATUSES } from "@/context/OrdersContext";
import { useImages } from "@/context/ImagesContext";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import Alert from "@/components/Alert/Alert";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faCheckCircle,
  faClock,
  faPrint,
  faShippingFast,
  faMoneyBillWave,
  faBan,
  faSearch,
  faFilter,
  faTimes,
  faExclamationTriangle,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function OrdersPage() {
  const { orders, loading, acknowledgeCancellation } = useOrders();
  const { images } = useImages();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [alert, setAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [demoFilter, setDemoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());

  // Check sessionStorage for flash messages (e.g., after deleting an order)
  useEffect(() => {
    const stored = sessionStorage.getItem("ordersFlashMessage");
    if (stored) {
      const { message, type } = JSON.parse(stored);
      setAlert({ type: type || "success", alertMessage: message });
      sessionStorage.removeItem("ordersFlashMessage");
    }
  }, []);

  const getImageUrl = (thumbnailId) => {
    if (!thumbnailId || !images) return "/images/image-not-found.png";
    if (thumbnailId === "__placeholder__") return "/images/image-not-found.png";
    const image = images.find((img) => img.id === thumbnailId);
    return image?.url || "/images/image-not-found.png";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return faClock;
      case ORDER_STATUSES.ACTIVE:
        return faBox;
      case ORDER_STATUSES.PRINTING:
        return faPrint;
      case ORDER_STATUSES.PRINTED:
        return faCheckCircle;
      case ORDER_STATUSES.SHIPPED:
        return faShippingFast;
      case ORDER_STATUSES.COMPLETED:
        return faCheckCircle;
      case ORDER_STATUSES.CANCELLED:
        return faBan;
      default:
        return faBox;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return "text-yellow-600";
      case ORDER_STATUSES.ACTIVE:
        return "text-blue-600";
      case ORDER_STATUSES.PRINTING:
        return "text-purple-600";
      case ORDER_STATUSES.PRINTED:
        return "text-indigo-600";
      case ORDER_STATUSES.SHIPPED:
        return "text-orange-600";
      case ORDER_STATUSES.COMPLETED:
        return "text-green-600";
      case ORDER_STATUSES.CANCELLED:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getCardStyle = (order) => {
    if (order.isDemo || order.status === ORDER_STATUSES.COMPLETED) {
      return "border-gray-200 bg-white";
    }
    if (order.status === ORDER_STATUSES.CANCELLED) {
      return "border-red-200 bg-red-50/40";
    }
    return "border-red-300 bg-red-50";
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return "Order received and awaiting confirmation";
      case ORDER_STATUSES.ACTIVE:
        return "Order confirmed and being prepared";
      case ORDER_STATUSES.PRINTING:
        return "Order is currently being printed";
      case ORDER_STATUSES.PRINTED:
        return "Printing complete, preparing for shipment";
      case ORDER_STATUSES.SHIPPED:
        return "Order has been shipped to customer";
      case ORDER_STATUSES.COMPLETED:
        return "Order delivered and completed";
      case ORDER_STATUSES.CANCELLED:
        return "Order has been cancelled";
      default:
        return "Order status";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = order.orderNumber?.toString() || "";
        const customerName = order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase()
          : "";
        const email = order.customer?.email?.toLowerCase() || "";
        const phone = order.customer?.phone || "";
        const customerNumber = order.customerNumber?.toString() || "";
        return (
          orderNumber.includes(query) ||
          customerName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          customerNumber.includes(query)
        );
      });
    }

    if (statusFilter === "in-progress") {
      filtered = filtered.filter(
        (order) =>
          order.status === ORDER_STATUSES.ACTIVE ||
          order.status === ORDER_STATUSES.PRINTING ||
          order.status === ORDER_STATUSES.PRINTED ||
          order.status === ORDER_STATUSES.SHIPPED,
      );
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentFilter === "paid") {
      filtered = filtered.filter((order) => order.isPaid);
    } else if (paymentFilter === "unpaid") {
      filtered = filtered.filter((order) => !order.isPaid);
    } else if (paymentFilter === "free") {
      filtered = filtered.filter((order) => order.paymentMethod === "free");
    }

    if (demoFilter === "demo") {
      filtered = filtered.filter((order) => order.isDemo);
    } else if (demoFilter === "real") {
      filtered = filtered.filter((order) => !order.isDemo);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case "date-asc":
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case "number-desc": {
          const aNum = typeof a.orderNumber === "number" ? a.orderNumber : 0;
          const bNum = typeof b.orderNumber === "number" ? b.orderNumber : 0;
          return bNum - aNum;
        }
        case "number-asc": {
          const aNum = typeof a.orderNumber === "number" ? a.orderNumber : 0;
          const bNum = typeof b.orderNumber === "number" ? b.orderNumber : 0;
          return aNum - bNum;
        }
        case "total-desc":
          return (b.total || 0) - (a.total || 0);
        case "total-asc":
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, paymentFilter, demoFilter, sortBy]);

  const stats = useMemo(() => {
    const total = orders.length;
    const realOrdersOnly = orders.filter((o) => !o.isDemo);
    const pending = realOrdersOnly.filter(
      (o) => o.status === ORDER_STATUSES.PENDING,
    ).length;
    const active = realOrdersOnly.filter(
      (o) =>
        o.status === ORDER_STATUSES.ACTIVE ||
        o.status === ORDER_STATUSES.PRINTING ||
        o.status === ORDER_STATUSES.PRINTED ||
        o.status === ORDER_STATUSES.SHIPPED,
    ).length;
    const completed = realOrdersOnly.filter(
      (o) => o.status === ORDER_STATUSES.COMPLETED,
    ).length;
    const paid = realOrdersOnly.filter((o) => o.isPaid).length;
    const unpaid = realOrdersOnly.filter((o) => !o.isPaid).length;
    const demoOrders = orders.filter((o) => o.isDemo).length;
    const realOrders = orders.filter((o) => !o.isDemo).length;
    const totalRevenue = realOrdersOnly
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + (o.subtotal || 0), 0);
    return {
      total,
      pending,
      active,
      completed,
      paid,
      unpaid,
      demoOrders,
      realOrders,
      totalRevenue,
    };
  }, [orders]);

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    demoFilter !== "all" ||
    sortBy !== "date-desc";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDemoFilter("all");
    setSortBy("date-desc");
  };

  const handleAcknowledgeCancellation = async (orderId) => {
    setAcknowledgingIds((prev) => new Set(prev).add(orderId));
    try {
      await acknowledgeCancellation(orderId);
    } catch (error) {
      console.error("Failed to acknowledge cancellation:", error);
    } finally {
      setAcknowledgingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const unacknowledgedCancellations = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === ORDER_STATUSES.CANCELLED &&
        order.cancelledBy === "customer" &&
        order.cancellationAcknowledged === false,
    );
  }, [orders]);

  if (loading) {
    return (
      <ResponsiveWidthWrapper>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">Loading orders...</p>
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all customer orders
          </p>
        </div>

        {/* Cancellation Notifications */}
        {unacknowledgedCancellations.length > 0 && (
          <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-6 shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-2xl text-orange-600"
              />
              <div>
                <h2 className="text-lg font-bold text-orange-900">
                  Customer Cancellations Pending Review
                </h2>
                <p className="text-sm text-orange-700">
                  {unacknowledgedCancellations.length} order
                  {unacknowledgedCancellations.length !== 1 ? "s" : ""}{" "}
                  cancelled by customers
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {unacknowledgedCancellations.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-orange-200 bg-white p-4 gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-sm text-gray-600">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Cancelled: {formatDate(order.updatedAt)}
                    </p>
                    {order.cancellationReason && (
                      <div className="mt-2 rounded bg-orange-100 p-2 border border-orange-200">
                        <p className="text-xs font-medium text-orange-800 mb-1">
                          Reason:
                        </p>
                        <p className="text-sm text-orange-900 break-words">
                          {order.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors w-full sm:w-auto"
                    >
                      View Order
                    </button>
                    <button
                      onClick={() => handleAcknowledgeCancellation(order.id)}
                      disabled={acknowledgingIds.has(order.id)}
                      className="flex items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      {acknowledgingIds.has(order.id)
                        ? "Acknowledging..."
                        : "Acknowledge"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            title="Total number of orders in the system"
          >
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.total}
            </p>
          </div>
          <div
            className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm"
            title="Orders received and awaiting confirmation"
          >
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="mt-1 text-2xl font-bold text-yellow-900">
              {stats.pending}
            </p>
          </div>
          <div
            className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
            title="Orders currently in progress (active, printing, printed, shipped)"
          >
            <p className="text-sm text-blue-700">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stats.active}
            </p>
          </div>
          <div
            className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm"
            title="Orders that have been delivered and completed"
          >
            <p className="text-sm text-green-700">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {stats.completed}
            </p>
          </div>
          <div
            className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm"
            title="Orders that have been paid for"
          >
            <p className="text-sm text-green-700">Paid</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {stats.paid}
            </p>
          </div>
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm"
            title="Orders that have not been paid for yet"
          >
            <p className="text-sm text-red-700">Unpaid</p>
            <p className="mt-1 text-2xl font-bold text-red-900">
              {stats.unpaid}
            </p>
          </div>
          <div
            className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
            title="Real customer orders"
          >
            <p className="text-sm text-blue-700">Real Orders</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stats.realOrders}
            </p>
          </div>
          <div
            className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm"
            title="Demo orders for testing/portfolio purposes"
          >
            <p className="text-sm text-purple-700">Demo Orders</p>
            <p className="mt-1 text-2xl font-bold text-purple-900">
              {stats.demoOrders}
            </p>
          </div>
          <div
            className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
            title="Total revenue from paid orders (excludes shipping)"
          >
            <p className="text-sm text-blue-700">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stats.totalRevenue}kr
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FontAwesomeIcon icon={faFilter} />
              Filters & Search
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                <FontAwesomeIcon icon={faTimes} />
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>
              <div
                className="relative"
                title="Search by Order Numbers, Name, Email, Phone Numbers and Customer Numbers."
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <FormInput
                  type="text"
                  placeholder="Order #, name, email, phone, customer #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <FormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value={ORDER_STATUSES.PENDING}>Pending</option>
                <option value="in-progress">In Progress</option>
                <option value={ORDER_STATUSES.CANCELLED}>Cancelled</option>
                <option value={ORDER_STATUSES.COMPLETED}>Completed</option>
              </FormSelect>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment
              </label>
              <FormSelect
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="free">Free</option>
              </FormSelect>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Order Type
              </label>
              <FormSelect
                value={demoFilter}
                onChange={(e) => setDemoFilter(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="real">Real Orders</option>
                <option value="demo">Demo Orders</option>
              </FormSelect>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <FormSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="number-desc">Order # (High to Low)</option>
                <option value="number-asc">Order # (Low to High)</option>
                <option value="total-desc">Total (High to Low)</option>
                <option value="total-asc">Total (Low to High)</option>
              </FormSelect>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <FontAwesomeIcon icon={faBox} />
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FontAwesomeIcon
              icon={faBox}
              className="mx-auto mb-4 text-5xl text-gray-400"
            />
            <p className="text-lg text-gray-600">No orders yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Orders will appear here when customers make purchases
            </p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FontAwesomeIcon
              icon={faSearch}
              className="mx-auto mb-4 text-5xl text-gray-400"
            />
            <p className="text-lg text-gray-600">
              No orders match your filters
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${getCardStyle(order)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                    {order.items && order.items.length > 0 && (
                      <div className="flex gap-1.5">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200"
                          >
                            <Image
                              src={
                                getImageUrl(item.thumbnailId) ||
                                "/images/image-not-found.png"
                              }
                              alt={item.title}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                            {item.quantity > 1 && (
                              <div className="absolute right-0 top-0 rounded-bl bg-black bg-opacity-75 px-1 py-0.5 text-[10px] font-medium text-white">
                                x{item.quantity}
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs font-medium text-gray-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        {order.isDemo ? (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            🎭 Demo
                          </span>
                        ) : (
                          <>
                            <span
                              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(order.status)} bg-opacity-10`}
                              title={getStatusDescription(order.status)}
                            >
                              <FontAwesomeIcon
                                icon={getStatusIcon(order.status)}
                                className="text-[10px]"
                              />
                              {order.status}
                            </span>
                            {order.paymentMethod === "free" ? (
                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <FontAwesomeIcon
                                  icon={faMoneyBillWave}
                                  className="text-[10px]"
                                />
                                Free
                              </span>
                            ) : order.isPaid ? (
                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <FontAwesomeIcon
                                  icon={faMoneyBillWave}
                                  className="text-[10px]"
                                />
                                Paid
                                {order.paymentMethod &&
                                  ` - ${order.paymentMethod}`}
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                Unpaid
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {order.customer && (
                          <span className="font-medium text-gray-900">
                            {order.customer.firstName} {order.customer.lastName}
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {order.total}kr
                    </p>
                    <p className="text-xs text-gray-600">
                      {order.items?.length || 0} item
                      {order.items?.length !== 1 && "s"}
                      {order.savings > 0 && ` • -${order.savings}kr`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsiveWidthWrapper>
  );
}

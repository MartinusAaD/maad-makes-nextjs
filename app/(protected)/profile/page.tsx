"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useOrders, ORDER_STATUSES } from "@/context/OrdersContext";
import { useImages } from "@/context/ImagesContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  updatePassword,
  updateEmail,
  sendEmailVerification,
} from "firebase/auth";
import { database } from "@/lib/firestoreConfig";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormFieldset from "@/components/Form/FormFieldset";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import Button from "@/components/Button/Button";
import Alert from "@/components/Alert/Alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faCheckCircle,
  faClock,
  faPrint,
  faShippingFast,
  faMoneyBillWave,
  faBan,
  faShoppingBag,
} from "@fortawesome/free-solid-svg-icons";
import { trackOrderCancel } from "@/utils/analytics";
import type { User } from "firebase/auth";
import type { Image as ImageType } from "@/types/image";
import type { Order } from "@/types/order";

interface AlertState {
  alertMessage: string;
  type: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PasswordData {
  newPassword: string;
  confirmPassword: string;
}

interface CancelDialog {
  orderId: string;
  orderNumber: string | number;
}

export default function ProfilePage() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { orders } = useOrders();
  const { images } = useImages();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [userCustomerNumber, setUserCustomerNumber] = useState<string | null>(
    null,
  );

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [passwords, setPasswords] = useState<PasswordData>({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(database, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserCustomerNumber(data.customerNumber || null);
          setProfileData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: currentUser.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            postalCode: data.postalCode || "",
            country: data.country || "",
          });
        } else {
          setProfileData((prev) => ({
            ...prev,
            email: currentUser.email || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setAlert({
          alertMessage: "Failed to load profile data",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      await setDoc(
        doc(database, "users", currentUser!.uid),
        {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
          country: profileData.country,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      if (profileData.email !== currentUser!.email)
        await updateEmail(currentUser!, profileData.email);

      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          setAlert({ alertMessage: "Passwords do not match", type: "error" });
          setSaving(false);
          return;
        }
        if (passwords.newPassword.length < 6) {
          setAlert({
            alertMessage: "Password must be at least 6 characters",
            type: "error",
          });
          setSaving(false);
          return;
        }
        await updatePassword(currentUser!, passwords.newPassword);
        setPasswords({ newPassword: "", confirmPassword: "" });
      }

      setAlert({
        alertMessage: "Profile updated successfully!",
        type: "success",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      let errorMessage = "Failed to update profile";
      const code = (error as { code?: string }).code;
      if (code === "auth/requires-recent-login")
        errorMessage =
          "For security reasons, please log out and log back in before updating your email or password.";
      else if (code === "auth/email-already-in-use")
        errorMessage = "This email is already in use by another account.";
      else if (code === "auth/weak-password")
        errorMessage = "Password should be at least 6 characters.";
      setAlert({ alertMessage: errorMessage, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPasswords({ newPassword: "", confirmPassword: "" });
    setAlert(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
      setAlert({
        alertMessage: "Failed to log out. Please try again.",
        type: "error",
      });
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(currentUser, {
        url: "https://maadmakes.no/verify-email?verified=true",
        handleCodeInApp: false,
      });
      setAlert({
        alertMessage: "Verification email sent! Please check your inbox.",
        type: "success",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      setAlert({
        alertMessage: "Failed to send verification email. Please try again.",
        type: "error",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveWidthWrapper>
        <div className="py-12 text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </ResponsiveWidthWrapper>
    );
  }

  return (
    <ResponsiveWidthWrapper>
      <div className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-primary">My Account</h1>
              {isAdmin && (
                <span className="px-4 py-1 bg-green text-white text-sm font-semibold rounded-full">
                  Admin
                </span>
              )}
              {currentUser?.emailVerified ? (
                <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  Verified
                </span>
              ) : (
                <span className="px-4 py-1 bg-gray-400 text-white text-sm font-semibold rounded-full">
                  Not Verified
                </span>
              )}
            </div>
            {userCustomerNumber && (
              <p className="text-sm text-gray-500 mt-2">
                Customer Number #
                <span className="font-medium text-gray-700">
                  {userCustomerNumber}
                </span>
              </p>
            )}
            {!currentUser?.emailVerified && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800">
                      Email Not Verified
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Please verify your email address to access all features.
                    </p>
                    <Button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="mt-3 !bg-amber-600 hover:!bg-amber-700 !text-white"
                    >
                      {sendingVerification
                        ? "Sending..."
                        : "Resend Verification Email"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <nav className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === "profile" ? "bg-primary text-white border-b-2 border-primary" : "text-gray-600 hover:bg-gray-50"}`}
              >
                My Profile
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === "orders" ? "bg-primary text-white border-b-2 border-primary" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Order History
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-4 text-center font-semibold transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </nav>
          </div>

          {alert && (
            <Alert
              alertMessage={alert.alertMessage}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormFieldset legend="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormGroup>
                    <FormLabel htmlFor="firstName">First Name</FormLabel>
                    <FormInput
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="John"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="lastName">Last Name</FormLabel>
                    <FormInput
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Doe"
                    />
                  </FormGroup>
                </div>
                <FormGroup>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="phone">Phone Number</FormLabel>
                  <FormInput
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="91234567"
                  />
                </FormGroup>
              </FormFieldset>

              <FormFieldset legend="Address Information">
                <FormGroup>
                  <FormLabel htmlFor="address">Street Address</FormLabel>
                  <FormInput
                    type="text"
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Adresseveien 123c"
                  />
                </FormGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormGroup>
                    <FormLabel htmlFor="city">City</FormLabel>
                    <FormInput
                      type="text"
                      id="city"
                      name="city"
                      value={profileData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Oslo"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
                    <FormInput
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={profileData.postalCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="0123"
                    />
                  </FormGroup>
                </div>
              </FormFieldset>

              {isEditing && (
                <FormFieldset legend="Change Password (Optional)">
                  <FormGroup>
                    <FormLabel htmlFor="newPassword">New Password</FormLabel>
                    <FormInput
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Leave blank to keep current password"
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="confirmPassword">
                      Confirm New Password
                    </FormLabel>
                    <FormInput
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                  </FormGroup>
                </FormFieldset>
              )}

              <div className="flex gap-4 justify-end">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                    }}
                    variant="primary"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="secondary"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          )}

          {activeTab === "orders" && (
            <OrderHistoryContent
              currentUser={currentUser}
              orders={orders}
              images={images}
              customerNumber={userCustomerNumber}
            />
          )}
        </div>
      </div>
    </ResponsiveWidthWrapper>
  );
}

interface OrderHistoryContentProps {
  currentUser: User | null;
  orders: Order[];
  images: ImageType[];
  customerNumber: string | null;
}

function OrderHistoryContent({
  currentUser,
  orders,
  images,
  customerNumber,
}: OrderHistoryContentProps) {
  const { updateOrderStatus, getOrderById } = useOrders();
  const [cancelDialog, setCancelDialog] = useState<CancelDialog | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const getImageUrl = (thumbnailId: string | undefined) => {
    if (!thumbnailId || !images) return null;
    const image = images.find((img) => img.id === thumbnailId);
    return image?.url || null;
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return "text-yellow-600 bg-yellow-50";
      case ORDER_STATUSES.ACTIVE:
        return "text-blue-600 bg-blue-50";
      case ORDER_STATUSES.PRINTING:
        return "text-purple-600 bg-purple-50";
      case ORDER_STATUSES.PRINTED:
        return "text-indigo-600 bg-indigo-50";
      case ORDER_STATUSES.SHIPPED:
        return "text-orange-600 bg-orange-50";
      case ORDER_STATUSES.COMPLETED:
        return "text-green-600 bg-green-50";
      case ORDER_STATUSES.CANCELLED:
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (
    timestamp:
      | { toDate?: () => Date; seconds?: number }
      | string
      | null
      | undefined,
  ) => {
    if (!timestamp) return "N/A";
    const date =
      typeof timestamp === "object" && timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp as string);
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userOrders = useMemo(() => {
    if (!currentUser?.email) return [];
    return orders
      .filter((order) => {
        if (customerNumber && order.customerNumber)
          return order.customerNumber === customerNumber;
        return order.customer?.email === currentUser.email;
      })
      .sort(
        (a, b) =>
          ((b.createdAt as { seconds?: number })?.seconds || 0) -
          ((a.createdAt as { seconds?: number })?.seconds || 0),
      );
  }, [orders, currentUser, customerNumber]);

  const canCancelOrder = (order: Order) =>
    order.status !== ORDER_STATUSES.SHIPPED &&
    order.status !== ORDER_STATUSES.COMPLETED &&
    order.status !== ORDER_STATUSES.CANCELLED;

  const handleCancelOrder = async (
    orderId: string,
    orderNumber: string | number,
  ) => {
    try {
      const order = await getOrderById(orderId);
      trackOrderCancel(orderNumber, cancellationReason);
      await updateOrderStatus(orderId, ORDER_STATUSES.CANCELLED, order.status, {
        cancelledBy: "customer",
        cancellationAcknowledged: false,
        cancellationReason: cancellationReason || "No reason provided",
      });
      setAlert({
        type: "success",
        alertMessage: `Order #${orderNumber} has been cancelled`,
      });
      setCancelDialog(null);
      setCancellationReason("");
    } catch (error) {
      console.error("Error cancelling order:", error);
      setAlert({
        type: "error",
        alertMessage: "Failed to cancel order. Please try again.",
      });
    }
  };

  if (userOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <FontAwesomeIcon
            icon={faShoppingBag}
            className="mx-auto mb-4 text-5xl text-gray-400"
          />
          <p className="text-gray-600 text-lg">No orders yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Your order history will appear here once you make a purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}

      {cancelDialog && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 overflow-hidden">
          <div className="p-8 max-w-md w-full mx-4 bg-light rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)] border-2 border-primary/40">
            <h1 className="text-2xl font-bold text-dark mb-4">
              Cancel Order #{cancelDialog.orderNumber}
            </h1>
            <p className="text-dark mb-4">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (Optional):
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Feel free to let us know why you are cancelling"
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {cancellationReason.length} / 300 characters
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleCancelOrder(
                    cancelDialog.orderId,
                    cancelDialog.orderNumber,
                  )
                }
              >
                Confirm Cancellation
              </Button>
              <Button
                onClick={() => {
                  setCancelDialog(null);
                  setCancellationReason("");
                }}
              >
                Keep Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {userOrders.map((order) => (
        <div
          key={order.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Order #{order.orderNumber}
                </h3>
                <span
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusColor(order.status)}`}
                >
                  <FontAwesomeIcon icon={getStatusIcon(order.status)} />
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Ordered:{" "}
                {formatDate(
                  order.createdAt as Parameters<typeof formatDate>[0],
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {order.total}kr
              </p>
              <div className="mt-1 flex items-center justify-end gap-2">
                {order.isPaid ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                    Paid
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600">
                    Unpaid
                  </span>
                )}
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <Image
                    src={
                      getImageUrl(item.thumbnailId) ||
                      "/images/image-not-found.png"
                    }
                    alt={item.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md border border-gray-200 object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {item.price}kr each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {item.price * item.quantity}kr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{order.subtotal}kr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">{order.shipping}kr</span>
            </div>
            {order.savings > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Savings:</span>
                <span className="font-medium">-{order.savings}kr</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{order.total}kr</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">Note:</p>
              <p className="mt-1 text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {order.trackingCode && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon
                  icon={faShippingFast}
                  className="text-gray-400"
                />
                <span>Tracking Number:</span>
                {(() => {
                  const provider = order.shippingProvider || "posten";
                  const trackingUrls: Record<string, string> = {
                    posten: `https://sporing.posten.no/sporing/${order.trackingCode}`,
                    postnord: `https://www.postnord.no/en/tools/track-and-trace?shipmentId=${order.trackingCode}`,
                    helthjem: `https://helthjem.no/sporing${order.trackingCode}`,
                  };
                  const trackingUrl = trackingUrls[provider];
                  return trackingUrl ? (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      {order.trackingCode}
                    </a>
                  ) : (
                    <span className="font-mono font-medium text-gray-900">
                      {order.trackingCode}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {canCancelOrder(order) && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  setCancelDialog({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                  })
                }
              >
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

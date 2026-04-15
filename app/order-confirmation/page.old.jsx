"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useImages } from "@/context/ImagesContext";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import Button from "@/components/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faShoppingBag,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { images } = useImages();
  const [orderData, setOrderData] = useState(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = sessionStorage.getItem("pendingOrderData");
    if (stored) {
      setOrderData(JSON.parse(stored));
      sessionStorage.removeItem("pendingOrderData");
      window.scrollTo(0, 0);
    } else {
      router.push("/");
    }
  }, [router]);

  const getImageUrl = (thumbnailId) => {
    if (!thumbnailId || !images) return null;
    const image = images.find((img) => img.id === thumbnailId);
    return image?.url || null;
  };

  if (!orderData) return null;

  return (
    <ResponsiveWidthWrapper>
      <div className="py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-6xl text-green-600"
              />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            {orderData.isDemo ? "Demo Order Confirmed!" : "Order Confirmed!"}
          </h1>
          <p className="text-xl text-gray-600">
            Order #{orderData.orderNumber}
          </p>
          {orderData.isDemo && (
            <div className="mt-4 mx-auto max-w-md">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-blue-800 font-semibold text-sm">
                  🎭 This is a demo order for testing purposes only. No payment
                  will be required and no products will be shipped.
                </p>
              </div>
            </div>
          )}
        </div>

        {orderData.isDemo && (
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              About Demo Orders
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">✓</span>
                <span>
                  Your demo order has been saved and can be viewed in your{" "}
                  <Link
                    href="/profile"
                    className="font-semibold text-primary hover:underline"
                  >
                    order history
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">✓</span>
                <span>
                  Demo orders let you experience the full ordering process
                  without any commitment.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-blue-600">✓</span>
                <span>
                  If you&apos;d like to place a real order, simply uncheck
                  &quot;Demo Mode&quot; at checkout.
                </span>
              </li>
            </ul>
          </div>
        )}

        {!orderData.isDemo && (
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border-2 border-green-200 bg-green-50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              What happens next?
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">✓</span>
                <span>
                  <strong>I will contact you soon</strong> regarding the
                  estimated time for your order and payment details.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">✓</span>
                <span>
                  You can track your order status in your{" "}
                  <Link
                    href="/profile"
                    className="font-semibold text-primary hover:underline"
                  >
                    order history
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-green-600">✓</span>
                <span>
                  Your order details have been saved and you&apos;ll receive
                  updates as your order progresses.
                </span>
              </li>
            </ul>
          </div>
        )}

        <div className="mx-auto max-w-2xl">
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Order Summary
            </h2>
            {orderData.items && orderData.items.length > 0 && (
              <div className="mb-6 space-y-4">
                {orderData.items.map((item, index) => (
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
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
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
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{orderData.subtotal}kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">{orderData.shipping}kr</span>
                </div>
                {orderData.savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings:</span>
                    <span className="font-medium">-{orderData.savings}kr</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>{orderData.total}kr</span>
                </div>
              </div>
            </div>
          </div>

          {orderData.customer && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Shipping Information
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>
                    {orderData.customer.firstName} {orderData.customer.lastName}
                  </strong>
                </p>
                <p>{orderData.customer.email}</p>
                <p>{orderData.customer.phone}</p>
                <p className="mt-2">
                  {orderData.customer.address}
                  <br />
                  {orderData.customer.postalCode} {orderData.customer.city}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              onClick={() => router.push("/")}
              className="w-full !bg-gray-600 hover:!bg-gray-700"
            >
              <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
              Continue Shopping
            </Button>
            <Button onClick={() => router.push("/profile")} className="w-full">
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              View Order History
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveWidthWrapper>
  );
}

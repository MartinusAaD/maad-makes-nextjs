"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faPlus,
  faImage,
  faFolder,
  faPalette,
  faShoppingCart,
  faExclamationCircle,
  faScroll,
} from "@fortawesome/free-solid-svg-icons";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { useOrders, ORDER_STATUSES } from "@/context/OrdersContext";
import type { Order, OrderStatus } from "@/types/order";

export default function DashboardPage() {
  const { orders } = useOrders();

  const pendingOrders = orders.filter(
    (order: Order) => order.status === ORDER_STATUSES.PENDING,
  ).length;

  const activeOrders = orders.filter((order: Order) =>
    (
      [
        ORDER_STATUSES.ACTIVE,
        ORDER_STATUSES.PRINTING,
        ORDER_STATUSES.PRINTED,
        ORDER_STATUSES.SHIPPED,
      ] as OrderStatus[]
    ).includes(order.status),
  ).length;

  const totalOrders = orders.length;

  const adminCards = [
    {
      title: "Orders",
      path: "/admin/orders",
      icon: faShoppingCart,
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
      badge: pendingOrders,
    },
    {
      title: "Products List",
      path: "/admin/products-list",
      icon: faBox,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      title: "Add Product",
      path: "/admin/add-product",
      icon: faPlus,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      title: "Image Library",
      path: "/admin/image-library",
      icon: faImage,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      title: "Categories",
      path: "/admin/categories",
      icon: faFolder,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
    },
    {
      title: "Filaments",
      path: "/admin/filaments",
      icon: faPalette,
      color: "bg-pink-500",
      hoverColor: "hover:bg-pink-600",
    },
    {
      title: "Waitlist",
      path: "/admin/waitlist",
      icon: faScroll,
      color: "bg-yellow-400",
      hoverColor: "hover:bg-yellow-500",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-bg-light py-6 min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-6 mt-8">
          <h1 className="text-3xl font-bold text-dark">Admin Dashboard</h1>

          {/* Order Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-bg-grey shadow-sm p-6 flex flex-col items-center gap-2">
              <FontAwesomeIcon
                icon={faExclamationCircle}
                className="text-yellow-500 text-3xl"
              />
              <p className="text-4xl font-bold text-dark">{pendingOrders}</p>
              <p className="text-sm text-gray-500 font-medium">
                Pending Orders
              </p>
            </div>
            <div className="bg-white rounded-xl border border-bg-grey shadow-sm p-6 flex flex-col items-center gap-2">
              <FontAwesomeIcon
                icon={faShoppingCart}
                className="text-indigo-500 text-3xl"
              />
              <p className="text-4xl font-bold text-dark">{activeOrders}</p>
              <p className="text-sm text-gray-500 font-medium">Active Orders</p>
            </div>
            <div className="bg-white rounded-xl border border-bg-grey shadow-sm p-6 flex flex-col items-center gap-2">
              <FontAwesomeIcon
                icon={faBox}
                className="text-blue-500 text-3xl"
              />
              <p className="text-4xl font-bold text-dark">{totalOrders}</p>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            </div>
          </div>

          {/* Admin Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {adminCards.map((card) => (
              <Link
                key={card.title}
                href={card.path}
                className={`${card.color} ${card.hoverColor} text-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-sm transition-all hover:scale-105 hover:shadow-md relative`}
              >
                {card.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {card.badge}
                  </span>
                )}
                <FontAwesomeIcon icon={card.icon} className="text-3xl" />
                <p className="font-semibold text-center">{card.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

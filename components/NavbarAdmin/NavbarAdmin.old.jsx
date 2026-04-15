"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { useOrders, ORDER_STATUSES } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";

const NavbarAdmin = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { orders } = useOrders();
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  if (!isAdmin || pathname === "/portfolio") return null;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Count pending orders that need attention
  const pendingOrdersCount = orders.filter(
    (order) => order.status === ORDER_STATUSES.PENDING,
  ).length;

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/products-list", label: "Products List" },
    { to: "/admin/add-product", label: "Add Product" },
    { to: "/admin/image-library", label: "Image Library" },
    { to: "/admin/categories", label: "Categories" },
    { to: "/admin/filaments", label: "Filaments" },
  ];

  return (
    <>
      {/* Spacer due to fixed styling */}
      <div className="pt-9"></div>

      <nav className="w-full py-2 bg-primary-darker flex justify-center items-center shadow-lg fixed top-[78px] z-40">
        <ResponsiveWidthWrapper>
          <div className="w-full flex items-center justify-end md:justify-center text-light font-bold">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 flex-nowrap">
              {adminLinks.map((link) => {
                const isActive = pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    href={link.to}
                    className={`text-light no-underline flex justify-center items-center px-4 active:scale-95 whitespace-nowrap relative ${
                      isActive
                        ? "underline underline-offset-4 decoration-[1.5px]"
                        : "hover:underline hover:underline-offset-4 hover:decoration-[1.5px]"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <p>{link.label}</p>
                    {link.to === "/admin/orders" && pendingOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-light flex items-center gap-2 px-4 py-2 rounded-lg bg-primary transition-colors hover:bg-primary-lighter active:scale-95"
                aria-label="Toggle admin menu"
              >
                <span className="text-sm font-bold">Admin Menu</span>
                <FontAwesomeIcon
                  icon={isMobileMenuOpen ? faXmark : faBars}
                  className="text-base"
                />
              </button>
            </div>
          </div>
        </ResponsiveWidthWrapper>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-[133px] left-0 right-0 bg-primary-darker shadow-lg z-30 transform transition-all duration-300 ease-in-out md:hidden overflow-hidden ${
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col py-2">
          {adminLinks.map((link) => {
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                className={`text-light no-underline flex items-center justify-between px-6 py-3 transition-colors active:scale-95 ${
                  isActive ? "bg-primary" : "hover:bg-primary"
                }`}
                onClick={closeMobileMenu}
              >
                <p className="m-0">{link.label}</p>
                {link.to === "/admin/orders" && pendingOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default NavbarAdmin;

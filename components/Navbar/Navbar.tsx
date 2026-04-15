"use client"; // This is added for NextJs projects for components that runs in the browser, a client-side render component.

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faUser,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface NavItemProps {
  href: string;
  exact?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

const NavItem = ({ href, exact, children, onClick }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <li className="list-none">
      <Link
        href={href}
        onClick={onClick}
        className={`text-light no-underline flex justify-center items-center p-4 rounded-xl transition-colors hover:bg-primary-lighter active:scale-95 ${
          isActive ? "bg-primary-lighter" : ""
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

const MobileNavItem = ({ href, exact, children, onClick }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <li className="list-none">
      <Link
        href={href}
        onClick={onClick}
        className={`text-light no-underline flex items-center p-4 rounded-xl transition-colors hover:bg-primary-lighter active:scale-95 text-lg ${
          isActive ? "bg-primary-lighter" : ""
        }`}
      >
        <p>{children}</p>
      </Link>
    </li>
  );
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { getItemCount } = useCart();
  const router = useRouter();
  const userMenuRef = useRef<HTMLLIElement>(null);

  const cartItemCount = getItemCount();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      closeMobileMenu();
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      {/* Spacer due to fixed styling */}
      <div className="pt-20"></div>

      {/* Navbar */}
      <nav className="w-full py-1 bg-primary flex justify-center items-center shadow-lg fixed top-0 z-50">
        <ResponsiveWidthWrapper>
          <div className="w-full flex justify-between items-center text-light font-bold">
            {/* Logo */}
            <div className="flex">
              <Link
                href="/"
                className="text-light no-underline flex justify-center items-center"
                onClick={closeMobileMenu}
              >
                <Image
                  src="/icons/maad-makes-logo-white.svg"
                  alt="Maad Makes logo"
                  width={70}
                  height={70}
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <ul className="hidden md:flex gap-2">
              <NavItem href="/" exact>
                <p>Home</p>
              </NavItem>
              <NavItem href="/portfolio">
                <p>Portfolio</p>
              </NavItem>
              <NavItem href="/store">
                <p>Store</p>
              </NavItem>
              <NavItem href="/contact">
                <p>Contact</p>
              </NavItem>
            </ul>

            {/* Right Side Icons */}
            <ul className="flex gap-2">
              {/* Cart Icon */}
              <li className="list-none">
                <Link
                  href="/cart"
                  onClick={closeMobileMenu}
                  className="text-light no-underline flex justify-center items-center p-4 rounded-xl bg-primary-darker transition-colors hover:bg-primary-lighter aspect-square active:scale-95 relative"
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    className="text-base"
                  />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              </li>

              {/* User Icon / Menu */}
              <li className="list-none relative" ref={userMenuRef}>
                {currentUser ? (
                  <>
                    <button
                      onClick={toggleUserMenu}
                      className="text-light flex justify-center items-center p-4 rounded-xl bg-primary-darker transition-colors hover:bg-primary-lighter aspect-square active:scale-95"
                      title="User Menu"
                    >
                      <FontAwesomeIcon icon={faUser} className="text-base" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-dark hover:bg-gray-100 transition-colors no-underline"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-dark hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-light no-underline flex justify-center items-center p-4 rounded-xl bg-primary-darker transition-colors hover:bg-primary-lighter aspect-square active:scale-95"
                  >
                    <FontAwesomeIcon icon={faUser} className="text-base" />
                  </Link>
                )}
              </li>

              {/* Hamburger Menu Button - Mobile Only */}
              <li className="list-none md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="text-light flex justify-center items-center p-4 rounded-xl bg-primary-darker transition-colors hover:bg-primary-lighter aspect-square active:scale-95"
                  aria-label="Toggle menu"
                >
                  <FontAwesomeIcon
                    icon={isMobileMenuOpen ? faXmark : faBars}
                    className="text-base"
                  />
                </button>
              </li>
            </ul>
          </div>
        </ResponsiveWidthWrapper>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-primary shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-4">
          <ul className="flex flex-col gap-2">
            <MobileNavItem href="/" exact onClick={closeMobileMenu}>
              Home
            </MobileNavItem>
            <MobileNavItem href="/portfolio" onClick={closeMobileMenu}>
              Portfolio
            </MobileNavItem>
            <MobileNavItem href="/store" onClick={closeMobileMenu}>
              Store
            </MobileNavItem>
            <MobileNavItem href="/contact" onClick={closeMobileMenu}>
              Contact
            </MobileNavItem>
            {currentUser && (
              <>
                <MobileNavItem href="/profile" onClick={closeMobileMenu}>
                  My Profile
                </MobileNavItem>
                <li className="list-none">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-light flex items-center p-4 rounded-xl transition-colors hover:bg-primary-lighter active:scale-95 text-lg"
                  >
                    <p>Logout</p>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;

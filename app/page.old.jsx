"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Button from "@/components/Button/Button";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { useProducts } from "@/context/ProductsContext";
import ProductCard from "@/components/ProductCard/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPalette,
  faCubesStacked,
  faTruckFast,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

const howDoesItWork = [
  {
    icon: faPalette,
    title: "Custom Designs",
    description: "Don't like the default colors? Request others!",
  },
  {
    icon: faCubesStacked,
    title: "High Quality",
    description:
      "3D Printed items are made with Bambu Lab X1 Carbon, and Bambu lab filaments.",
  },
  {
    icon: faTruckFast,
    title: "Shipping",
    description:
      "Norway only. Printing on request. Each print with assembly takes about 6-10 hours. Shiping & processing time may vary based on demand, 2 - 3 Days on average.",
  },
  {
    icon: faStar,
    title: "Unique Collections",
    description:
      "The models are made by either myself or other high quality creators.",
  },
];

export default function Home() {
  const { products, loading } = useProducts();
  const featuredProducts = products.filter((p) => !p.isTempFill).slice(0, 6);
  const productsRef = useRef(null);
  const [productsVisible, setProductsVisible] = useState(false);
  const cardsRef = useRef(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    if (loading || featuredProducts.length === 0) return;

    const currentRef = productsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProductsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(currentRef);

    const rect = currentRef.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (isInViewport) {
      setProductsVisible(true);
      observer.disconnect();
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, featuredProducts.length]);

  useEffect(() => {
    const currentRef = cardsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(currentRef);

    const rect = currentRef.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setCardsVisible(true);
      observer.disconnect();
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-darker -mt-20 pt-36 pb-16 md:pt-44 md:pb-24">
        {/* Glowing orb accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-125 w-125 rounded-full bg-primary-lighter/30 blur-[140px] animate-[float_8s_ease-in-out_infinite]" />
          <div
            className="absolute -bottom-40 -right-40 h-125 w-125 rounded-full bg-primary-lighter/20 blur-[140px] animate-[float_11s_ease-in-out_infinite]"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/50 blur-[100px]" />
        </div>

        {/* Dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <ResponsiveWidthWrapper>
          <div className="relative flex flex-col items-center text-center px-4 space-y-8">
            <div className="space-y-4 max-w-4xl">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
                style={{ animationDelay: "0s" }}
              >
                Welcome to MAaD Makes
              </h1>
              <div
                className="flex justify-center gap-4 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
                style={{ animationDelay: "0.2s" }}
              >
                <p className="text-xl md:text-2xl text-white/70">
                  We sell Character inspired balls, TCG Accessories and more!
                </p>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row gap-4 pt-4 w-full max-w-md opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href="/store" className="flex-1">
                <Button className="h-15 rounded-2xl bg-white! text-primary! hover:bg-gray-100!">
                  Browse Store
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button className="h-15 rounded-2xl border border-white/30 bg-white/10! text-white! hover:bg-white/20!">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </ResponsiveWidthWrapper>
      </section>

      {/* Why Choose MAaD Makes */}
      <section className="py-16 bg-gray-50">
        <ResponsiveWidthWrapper>
          <div
            ref={cardsRef}
            className="flex gap-4 flex-col justify-center items-center w-full px-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
              {howDoesItWork.map((item, index) => (
                <div
                  key={index}
                  style={{
                    animationDelay: cardsVisible ? `${index * 0.15}s` : "0s",
                  }}
                  className={`flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-black/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 opacity-0 ${cardsVisible ? "animate-[fadeInScale_0.6s_ease-out_forwards]" : ""}`}
                >
                  <div className="text-primary-lighter mb-4">
                    <FontAwesomeIcon icon={item.icon} className="text-5xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveWidthWrapper>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-white">
        <ResponsiveWidthWrapper>
          <div className="px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Newest Products
                </h2>
                <p className="text-gray-600">Check out our latest creations</p>
              </div>
              <Link
                href="/store"
                className="text-primary-lighter hover:text-primary-darker font-semibold flex items-center gap-2 transition-colors"
              >
                View All
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              </div>
            ) : featuredProducts.length > 0 ? (
              <div
                ref={productsRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
              >
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    style={{
                      animationDelay: productsVisible
                        ? `${index * 0.1}s`
                        : "0s",
                    }}
                    className={
                      productsVisible
                        ? "opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
                        : "opacity-0"
                    }
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No products available yet. Check back soon!
                </p>
                <Link
                  href="/store"
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block"
                >
                  Visit Store
                </Link>
              </div>
            )}
          </div>
        </ResponsiveWidthWrapper>
      </section>
    </div>
  );
}

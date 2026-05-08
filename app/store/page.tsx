"use client";

import React, { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTurnUp,
  faFilter,
  faXmark,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import useDebounce from "@/hooks/useDebounce";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { useProducts } from "@/context/ProductsContext";
import { useCategories } from "@/context/CategoriesContext";
import ProductCard from "@/components/ProductCard/ProductCard";
import InfoCard from "@/components/InfoCard/InfoCard";
import { isProductOnSale } from "@/utils/productHelpers";
import { trackSearch } from "@/utils/analytics";

export default function StorePage() {
  const { products } = useProducts();
  const { categories } = useCategories();

  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 2) {
      trackSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  const { parentCategories, getSubcategories } = useMemo(() => {
    if (!categories)
      return { parentCategories: [], getSubcategories: () => [] };
    const parents = categories
      .filter((c) => {
        const name = (c?.name || "").toLowerCase();
        return !c.parentId && name !== "3d-printed" && name !== "pokemon";
      })
      .sort((a, b) =>
        (a?.name || "").toString().localeCompare((b?.name || "").toString()),
      );
    const getSubcategories = (parentId: string) =>
      categories
        .filter((c) => c.parentId === parentId)
        .sort((a, b) =>
          (a?.name || "").toString().localeCompare((b?.name || "").toString()),
        );
    return { parentCategories: parents, getSubcategories };
  }, [categories]);

  const hasProductsOnSale = useMemo(() => {
    if (!products) return false;
    return products.some((p) => p.isActive && isProductOnSale(p));
  }, [products]);

  const productsToRender = useMemo(() => {
    if (!products) return [];
    let out = products.filter((p) => !p.isTempFill);
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (q) {
      out = out.filter((p) => {
        const title = (p?.title || "").toString().toLowerCase();
        const desc = (p?.descriptionMarkdown || "").toString().toLowerCase();
        const keywords = Array.isArray(p?.searchKeywords)
          ? p.searchKeywords.join(" ").toLowerCase()
          : "";
        return title.includes(q) || desc.includes(q) || keywords.includes(q);
      });
    }
    if (selectedCategories && selectedCategories.length > 0) {
      out = out.filter((p) => {
        const regularCategories = selectedCategories.filter(
          (id) => id !== "on-sale",
        );
        const hasOnSaleFilter = selectedCategories.includes("on-sale");
        let passesOnSale = true;
        let passesCategory = true;
        if (hasOnSaleFilter) passesOnSale = isProductOnSale(p);
        if (regularCategories.length > 0) {
          const subcategories = regularCategories.filter((id) => {
            const cat = categories.find((c) => c.id === id);
            return cat && cat.parentId;
          });
          const parentOnlyCategories = regularCategories.filter((id) => {
            const cat = categories.find((c) => c.id === id);
            return cat && !cat.parentId;
          });
          const cats = p?.categories;
          if (!cats) {
            passesCategory = false;
          } else if (Array.isArray(cats)) {
            const filterBy =
              subcategories.length > 0 ? subcategories : parentOnlyCategories;
            passesCategory = filterBy.some((id) => cats.includes(id));
          } else if (typeof cats === "string") {
            const filterBy =
              subcategories.length > 0 ? subcategories : parentOnlyCategories;
            passesCategory = filterBy.includes(cats);
          } else {
            passesCategory = false;
          }
        }
        return passesOnSale && passesCategory;
      });
    }
    const getCreatedTime = (product: (typeof products)[0]) => {
      const v = product?.createdAt;
      if (!v) return 0;
      if (
        typeof v === "object" &&
        typeof (v as { seconds?: number }).seconds === "number"
      )
        return (v as { seconds: number }).seconds * 1000;
      if (typeof v === "number") return v;
      const parsed = Date.parse(v as unknown as string);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    const getPrice = (p: (typeof products)[0]) => {
      const v = p?.price;
      if (v == null) return 0;
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    };
    switch (sort) {
      case "title-asc":
        out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "title-desc":
        out.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      case "created-desc":
        out.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
        break;
      case "created-asc":
        out.sort((a, b) => getCreatedTime(a) - getCreatedTime(b));
        break;
      case "price-asc":
        out.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case "price-desc":
        out.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      default:
        break;
    }
    return out;
  }, [products, sort, debouncedSearch, selectedCategories, categories]);

  const activeFilterCount = selectedCategories.filter(
    (id) => id !== "on-sale",
  ).length;
  const activeProductCount = productsToRender.filter((p) => p.isActive).length;

  const categoriesContent = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-1">
        <h3 className="text-xs font-bold text-dark/40 uppercase tracking-widest">
          Filters
        </h3>
        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      {hasProductsOnSale && (
        <button
          type="button"
          onClick={() => {
            const active = selectedCategories.includes("on-sale");
            if (active)
              setSelectedCategories((prev) =>
                prev.filter((s) => s !== "on-sale"),
              );
            else setSelectedCategories((prev) => [...prev, "on-sale"]);
          }}
          className={`text-left py-2 px-3 border cursor-pointer rounded-lg font-bold text-sm transition-colors ${selectedCategories.includes("on-sale") ? "bg-yellow text-dark border-yellow-darker" : "bg-yellow/10 text-yellow-darker border-yellow/40 hover:bg-yellow/20"}`}
        >
          🔥 On Sale!
        </button>
      )}

      {parentCategories.map((parent) => {
        const parentId = parent?.id;
        const parentLabel = parent?.name || parentId;
        const parentActive = selectedCategories.includes(parentId!);
        const subcategories = getSubcategories(parentId!);
        return (
          <React.Fragment key={parentId}>
            <button
              type="button"
              onClick={() => {
                if (parentActive) {
                  const subIds = subcategories.map((sub) => sub.id);
                  setSelectedCategories((prev) =>
                    prev.filter(
                      (id) => id !== parentId && !subIds.includes(id),
                    ),
                  );
                } else {
                  setSelectedCategories((prev) => {
                    const onSaleFilter = prev.includes("on-sale")
                      ? ["on-sale"]
                      : [];
                    return [...onSaleFilter, parentId!];
                  });
                }
              }}
              className={`text-left py-2 px-3 border cursor-pointer rounded-lg transition-colors font-semibold text-sm ${parentActive ? "bg-primary text-light border-primary" : "bg-white text-dark border-gray-200 hover:border-primary hover:text-primary"}`}
            >
              {parentLabel}
            </button>
            {subcategories.length > 0 && (
              <div
                className={`ml-3 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${parentActive ? "max-h-125 opacity-100 mb-1" : "max-h-0 opacity-0"}`}
              >
                {subcategories.map((sub) => {
                  const subId = sub?.id;
                  const subLabel = sub?.name || subId;
                  const subActive = selectedCategories.includes(subId!);
                  return (
                    <button
                      key={subId}
                      type="button"
                      onClick={() => {
                        if (subActive) {
                          setSelectedCategories((prev) =>
                            prev.filter((id) => id !== subId),
                          );
                        } else {
                          setSelectedCategories((prev) => {
                            const newSelected = [...prev, subId!];
                            if (!prev.includes(parentId!))
                              newSelected.push(parentId!);
                            return newSelected;
                          });
                        }
                      }}
                      className={`text-left py-1.5 px-2.5 text-sm border cursor-pointer rounded-lg transition-colors ${subActive ? "bg-primary/10 text-primary border-primary" : "bg-white text-dark/70 border-gray-200 hover:border-primary hover:text-primary"}`}
                    >
                      <FontAwesomeIcon icon={faArrowTurnUp} rotation={90} />{" "}
                      {subLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="pt-8 pb-5 border-b border-gray-100">
          <div className="mb-5">
            <h1 className="text-4xl font-bold text-dark tracking-tight">
              Store
            </h1>
            <p className="text-sm text-dark/40 mt-1">
              {activeProductCount} product
              {activeProductCount !== 1 ? "s" : ""} found
            </p>
          </div>
          {/* Full-width search + sort row */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none text-sm"
              />
              <input
                aria-label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full py-2.5 pl-9 pr-4 rounded-lg border border-gray-200 bg-white text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-colors text-sm${search ? " pr-9" : ""}`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="store-sort"
                className="text-xs font-semibold text-dark/40 uppercase tracking-widest hidden sm:block"
              >
                Sort
              </label>
              <select
                id="store-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm py-2.5 px-2.5 rounded-lg border border-gray-200 bg-white text-dark cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
              >
                <option value="default">Default</option>
                <option value="title-asc">Title A → Z</option>
                <option value="title-desc">Title Z → A</option>
                <option value="created-desc">Newest</option>
                <option value="created-asc">Oldest</option>
                <option value="price-asc">Price Low → High</option>
                <option value="price-desc">Price High → Low</option>
              </select>
            </div>
          </div>
        </div>
      </ResponsiveWidthWrapper>

      <ResponsiveWidthWrapper>
        <div className="flex flex-col gap-5 py-6 pb-16">
          {/* Mobile filter button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 text-dark rounded-lg font-semibold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors text-sm"
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-light rounded-full px-2 py-0.5 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
            {/* Desktop sidebar */}
            <aside className="hidden md:block w-full">
              <div className="sticky top-4">{categoriesContent}</div>
            </aside>

            {/* Product grid */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 w-full">
                <InfoCard />
                {productsToRender
                  .filter((product) => product.isActive)
                  .map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      animationDelay={index * 0.05}
                    />
                  ))}
                {activeProductCount === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-5xl text-gray-200 mb-4"
                    />
                    <h3 className="text-lg font-bold text-gray-400 mb-2">
                      No products found
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Try adjusting your search or clearing your filters
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setSelectedCategories([]);
                      }}
                      className="text-primary font-semibold text-sm hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ResponsiveWidthWrapper>

      {/* Mobile filter overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${isFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsFilterOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-primary">
            <h2 className="text-base font-bold text-light tracking-tight">
              Filters
            </h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-light/70 p-2 hover:text-light rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{categoriesContent}</div>
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => setSelectedCategories([])}
              className="flex-1 py-2 px-4 bg-white border border-gray-200 text-dark rounded-lg font-semibold hover:border-primary hover:text-primary transition-colors text-sm"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-2 px-4 bg-primary text-light rounded-lg font-semibold hover:bg-primary-lighter transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-sm font-bold text-dark uppercase tracking-wider">
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
          className={`text-left py-2 px-2.5 border cursor-pointer rounded font-bold transition-colors ${selectedCategories.includes("on-sale") ? "bg-yellow text-dark border-yellow-darker" : "bg-yellow-darker text-dark border-yellow hover:bg-yellow active:bg-yellow-darker"}`}
        >
          🔥On Sale!
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
              className={`text-left py-2 px-2.5 border border-gray-300 text-light cursor-pointer rounded transition-colors font-semibold ${parentActive ? "bg-primary-lighter" : "bg-primary-darker hover:bg-primary active:bg-primary-lighter"}`}
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
                      className={`text-left py-1.5 px-2 text-sm border border-gray-300 text-light cursor-pointer rounded transition-colors ${subActive ? "bg-primary-lighter" : "bg-primary-darker hover:bg-primary"}`}
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
    <div className="flex pt-8 pb-16">
      <ResponsiveWidthWrapper>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-bold text-dark">Store</h1>
              <p className="text-sm text-gray-400 mt-1">
                {activeProductCount} product
                {activeProductCount !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 items-center relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 text-gray-400 pointer-events-none"
              />
              <input
                aria-label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full p-2 pl-10 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary/70 transition-colors${search ? " pr-9" : ""}`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <label
                className="font-bold text-dark shrink-0"
                htmlFor="store-sort"
              >
                Sort:
              </label>
              <select
                id="store-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="flex-1 sm:flex-none p-2 rounded border-2 border-primary/50 bg-light text-dark cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
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

          <div className="md:hidden">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-full py-3 px-4 bg-primary text-light rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-lighter transition-colors active:scale-95"
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-yellow text-dark rounded-full px-2 py-0.5 text-sm font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-[220px_1fr] gap-4 items-start">
            <aside className="hidden md:block w-full">
              <div className="sticky top-4">{categoriesContent}</div>
            </aside>
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
      </ResponsiveWidthWrapper>

      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${isFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsFilterOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b-2 border-primary bg-primary">
            <h2 className="text-xl font-bold text-light">Filters</h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-light p-2 hover:bg-primary-lighter rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{categoriesContent}</div>
          <div className="p-4 border-t-2 border-gray-200 flex gap-2">
            <button
              onClick={() => setSelectedCategories([])}
              className="flex-1 py-2 px-4 bg-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-400 transition-colors active:scale-95"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-2 px-4 bg-primary text-light rounded-lg font-semibold hover:bg-primary-lighter transition-colors active:scale-95"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

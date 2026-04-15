"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import { useProducts } from "@/context/ProductsContext";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import useDebounce from "@/hooks/useDebounce";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faMagnifyingGlass,
  faPlus,
  faXmark,
  faCopy,
  faPencil,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/components/Button/Button";
import { useImages } from "@/context/ImagesContext";
import { isProductOnSale } from "@/utils/productHelpers";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import Alert from "@/components/Alert/Alert";
import type { Product } from "@/types/product";
import type { Image } from "@/types/image";

type ConfirmDialog = {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
};

type AlertState = {
  alertMessage: string;
  type: "success" | "error" | "info" | "warning";
};

type FilterBy = "newest" | "oldest" | "on-sale" | "inactive" | "all";

export default function ProductsListPage() {
  const { products, loading } = useProducts();
  const { images } = useImages();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [saleFromDate, setSaleFromDate] = useState<string | null>(null);
  const [saleToDate, setSaleToDate] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<FilterBy>("newest");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(
    null,
  );
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  const imagesById = useMemo(() => {
    const map = new Map<string, Image>();
    images.forEach((img: Image) => map.set(img.id, img));
    return map;
  }, [images]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p: Product) => {
        const title = (p?.title || "").toLowerCase();
        const desc = (p?.descriptionMarkdown || "").toLowerCase();
        const id = (p?.id || "").toLowerCase();
        const ean = (p?.eanBarcode || "").toLowerCase();
        const productCode = (p?.productCode || "").toLowerCase();
        const keywords = Array.isArray(p?.searchKeywords)
          ? p.searchKeywords.join(" ").toLowerCase()
          : "";
        const manufacturer = (p?.creatorManufacturer || "").toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          id.includes(q) ||
          ean.includes(q) ||
          productCode.includes(q) ||
          keywords.includes(q) ||
          manufacturer.includes(q)
        );
      });
    }

    switch (filterBy) {
      case "newest":
        result = [...result].sort((a, b) => {
          const aTime = a?.createdAt?.seconds || 0;
          const bTime = b?.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        break;
      case "oldest":
        result = [...result].sort((a, b) => {
          const aTime = a?.createdAt?.seconds || 0;
          const bTime = b?.createdAt?.seconds || 0;
          return aTime - bTime;
        });
        break;
      case "on-sale":
        result = result.filter((p) => isProductOnSale(p));
        break;
      case "inactive":
        result = result.filter((p) => !p?.isActive);
        break;
      default:
        break;
    }

    return result;
  }, [products, debouncedSearch, filterBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const hasMoreProducts = filteredProducts.length > displayLimit;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(
        new Set(
          filteredProducts.map((p) => p.id).filter((id): id is string => !!id),
        ),
      );
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleEdit = (productId: string) => {
    router.push(`/admin/edit-product/${productId}`);
  };

  const handleDuplicate = async (product: Product) => {
    setConfirmDialog({
      title: "Duplicate Product?",
      message: `Are you sure you want to duplicate "${product.title}"?`,
      onConfirm: async () => {
        try {
          const duplicated = {
            ...product,
            title: `${product.title} (Copy)`,
            slug: `${product.slug}-copy`,
            createdAt: serverTimestamp(),
            active: false,
          };
          delete duplicated.id;
          await addDoc(collection(database, "products"), duplicated);
          setAlert({
            alertMessage: "Product duplicated successfully!",
            type: "success",
          });
        } catch (err) {
          console.error("Error duplicating product:", err);
          setAlert({
            alertMessage: "Failed to duplicate the product",
            type: "error",
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) {
      setAlert({ alertMessage: "No products are selected!", type: "error" });
      return;
    }
    setConfirmDialog({
      title: "Delete Multiple Products?",
      message: `Are you sure you want to delete ${selectedIds.size} product(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          for (const id of selectedIds) {
            await deleteDoc(doc(database, "products", id));
          }
          setSelectedIds(new Set());
          setAlert({
            alertMessage: "Products were deleted successfully!",
            type: "success",
          });
        } catch (err) {
          console.error("Error deleting products:", err);
          setAlert({
            alertMessage: "Failed to delete products!",
            type: "error",
          });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeleteProduct = async (product: Product) => {
    setConfirmDialog({
      title: "Delete Product?",
      message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(database, "products", product.id));
          setAlert({
            alertMessage: "Product was deleted successfully!",
            type: "success",
          });
        } catch (error) {
          console.error("Couldn't delete product:", error);
          setAlert({ alertMessage: "Failed to delete product", type: "error" });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleSetSaleDate = async () => {
    if (!selectedIds.size) {
      setAlert({ alertMessage: "No products are selected", type: "info" });
      return;
    }
    if (!saleFromDate || !saleToDate) {
      setAlert({
        alertMessage: "Please set both from and to dates",
        type: "error",
      });
      return;
    }
    setConfirmDialog({
      title: "Set Sale Dates?",
      message: `Set sale dates for ${selectedIds.size} product(s) from ${new Date(saleFromDate).toLocaleDateString()} to ${new Date(saleToDate).toLocaleDateString()}?`,
      onConfirm: async () => {
        try {
          for (const id of selectedIds) {
            const product = products.find((p) => p.id === id);
            if (product) {
              await updateDoc(doc(database, "products", id), {
                sale: { from: saleFromDate, to: saleToDate },
              });
            }
          }
          setSelectedIds(new Set());
          setSaleFromDate(null);
          setSaleToDate(null);
          setAlert({
            alertMessage: "Sale dates set successfully!",
            type: "success",
          });
        } catch (err) {
          console.error("Error setting sale dates:", err);
          setAlert({ alertMessage: "Failed to set sale dates", type: "error" });
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <p className="text-dark/40 text-sm">Loading products...</p>
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-bg-light">
      {/* Page header */}
      <div className="w-full bg-primary">
        <ResponsiveWidthWrapper>
          <div className="flex items-center justify-between py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-light tracking-tight">
                Products
              </h1>
              <p className="text-light/50 text-sm mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                total
              </p>
            </div>
            <Link
              href="/admin/add-product"
              className="flex items-center gap-2 px-4 py-2 bg-light/10 hover:bg-light/20 text-light rounded-lg border border-light/20 transition-colors text-sm font-medium shrink-0"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              Add Product
            </Link>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-4 py-8">
          {/* Toolbar: search + filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 p-2 rounded border-2 border-primary/50 bg-white text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="p-2 rounded border-2 border-primary/50 bg-white text-dark cursor-pointer hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              <option value="all">All Products</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="on-sale">On Sale</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk actions panel — shown only when something is selected */}
          {selectedIds.size > 0 && (
            <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} product
                  {selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm border-none rounded-lg font-bold bg-red text-light transition-colors hover:bg-red-darker"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </div>
              <div className="h-px bg-bg-grey" />
              <div className="flex gap-3 items-center flex-wrap">
                <FontAwesomeIcon
                  icon={faTag}
                  className="w-4 h-4 text-primary/50 shrink-0"
                />
                <input
                  type="datetime-local"
                  value={saleFromDate ?? ""}
                  onChange={(e) => setSaleFromDate(e.target.value)}
                  className="p-2 rounded border-2 border-primary/50 flex-1 min-w-44 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-dark bg-white text-sm transition-colors"
                />
                <span className="text-sm font-medium text-dark/50">to</span>
                <input
                  type="datetime-local"
                  value={saleToDate ?? ""}
                  onChange={(e) => setSaleToDate(e.target.value)}
                  className="p-2 rounded border-2 border-primary/50 flex-1 min-w-44 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-dark bg-white text-sm transition-colors"
                />
                <button
                  onClick={handleSetSaleDate}
                  className="px-4 py-2 text-sm border-none rounded-lg font-bold bg-primary text-light transition-colors hover:bg-primary-lighter shrink-0"
                >
                  Set Sale Dates
                </button>
              </div>
            </div>
          )}

          {/* Products table */}
          <div className="rounded-xl border border-bg-grey overflow-hidden bg-white shadow-sm">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[44px_72px_1fr_100px_180px] gap-4 items-center px-4 py-3 bg-primary text-light text-xs font-semibold uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === filteredProducts.length &&
                    filteredProducts.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-light"
                />
              </div>
              <div />
              <div>Product</div>
              <div>Price</div>
              <div>Actions</div>
            </div>

            {/* Rows */}
            {displayedProducts.length > 0 ? (
              <ul className="list-none p-0 m-0 divide-y divide-bg-grey">
                {displayedProducts.map((product: Product) => {
                  const thumbnailImage = imagesById.get(
                    product.thumbnailId ?? "",
                  );
                  const isSelected = selectedIds.has(product.id ?? "");
                  return (
                    <li
                      key={product.id}
                      className={`flex flex-col md:grid md:grid-cols-[44px_72px_1fr_100px_180px] gap-4 items-center px-4 py-3 transition-colors cursor-pointer hover:bg-bg-light/60 ${isSelected ? "bg-primary/5" : ""}`}
                      onClick={() => handleEdit(product.id ?? "")}
                      title={product.title}
                    >
                      {/* Checkbox */}
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            handleSelectProduct(
                              product.id ?? "",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 accent-primary"
                        />
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-bg-grey">
                        <NextImage
                          src={
                            thumbnailImage?.url || "/images/image-not-found.png"
                          }
                          alt={thumbnailImage?.alt || "No image available"}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Title + badges */}
                      <div className="min-w-0 flex flex-col gap-1.5 w-full md:w-auto">
                        <h3 className="text-sm font-semibold text-dark leading-snug line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                              product.isActive
                                ? "bg-green/15 text-green-darker"
                                : "bg-red/15 text-red-darker"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide whitespace-nowrap bg-primary/10 text-primary">
                            Stock: {product.stock || 0}
                          </span>
                          {isProductOnSale(product) && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide whitespace-nowrap bg-yellow/20 text-yellow-darker">
                              On Sale
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-sm font-semibold text-dark w-full md:w-auto">
                        {product.price != null
                          ? `${Number(product.price).toFixed(2)} kr`
                          : "—"}
                        {isProductOnSale(product) &&
                          product.priceOnSale != null && (
                            <span className="block text-xs font-normal text-yellow-darker">
                              Sale: {Number(product.priceOnSale).toFixed(2)} kr
                            </span>
                          )}
                      </div>

                      {/* Actions */}
                      <div
                        className="flex gap-2 w-full md:w-auto pointer-events-none *:pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEdit(product.id ?? "")}
                          className="flex items-center justify-center gap-1.5 shrink-0 px-3 py-1.5 text-xs bg-primary text-light border-none rounded-lg font-bold transition-colors hover:bg-primary-lighter"
                          title="Edit product"
                        >
                          <FontAwesomeIcon
                            icon={faPencil}
                            className="w-3 h-3"
                          />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="flex items-center justify-center gap-1.5 shrink-0 px-3 py-1.5 text-xs bg-primary/10 text-primary border-none rounded-lg font-bold transition-colors hover:bg-primary/20"
                          title="Duplicate product"
                        >
                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="flex items-center justify-center p-1.5 bg-red/10 text-red border-none rounded-lg font-bold transition-colors hover:bg-red hover:text-light"
                          title="Delete product"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-bg-grey flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="w-4 h-4 text-dark/25"
                  />
                </div>
                <p className="text-dark/50 font-medium text-sm">
                  {debouncedSearch
                    ? `No products found for "${debouncedSearch}"`
                    : "No products yet"}
                </p>
                {debouncedSearch && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-primary text-sm underline underline-offset-2 hover:text-primary-lighter transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMoreProducts && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-dark/40 text-sm">
                Showing {displayedProducts.length} of {filteredProducts.length}
              </p>
              <Button onClick={handleLoadMore} className="max-w-xs">
                Load More ({filteredProducts.length - displayLimit} remaining)
              </Button>
            </div>
          )}
        </div>
      </ResponsiveWidthWrapper>

      {confirmDialog && (
        <AlertDialog
          alertTitle={confirmDialog.title}
          alertMessage={confirmDialog.message}
          confirmAction={confirmDialog.onConfirm}
          setShowModal={() => setConfirmDialog(null)}
        />
      )}

      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}

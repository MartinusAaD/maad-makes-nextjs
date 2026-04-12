"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Button from "@/components/Button/Button";
import ButtonSquare from "@/components/ButtonSquare/ButtonSquare";
import { useImages } from "@/context/ImagesContext";
import { isProductOnSale } from "@/utils/productHelpers";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import Alert from "@/components/Alert/Alert";

export default function ProductsListPage() {
  const { products, loading } = useProducts();
  const { images } = useImages();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saleFromDate, setSaleFromDate] = useState("");
  const [saleToDate, setSaleToDate] = useState("");
  const [filterBy, setFilterBy] = useState("newest");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [alert, setAlert] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  const imagesById = useMemo(() => {
    const map = new Map();
    images.forEach((img) => map.set(img.id, img));
    return map;
  }, [images]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) => {
        const title = (p?.title || "").toLowerCase();
        const desc = (p?.description || "").toLowerCase();
        const id = (p?.id || "").toLowerCase();
        const ean = (p?.ean || "").toLowerCase();
        const productCode = (p?.productCode || "").toLowerCase();
        const keywords = Array.isArray(p?.searchKeywords)
          ? p.searchKeywords.join(" ").toLowerCase()
          : "";
        const brand = (p?.brand || "").toLowerCase();
        const manufacturer = (p?.manufacturer || "").toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          id.includes(q) ||
          ean.includes(q) ||
          productCode.includes(q) ||
          keywords.includes(q) ||
          brand.includes(q) ||
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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (id, checked) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleEdit = (productId) => {
    router.push(`/admin/edit-product/${productId}`);
  };

  const handleDuplicate = async (product) => {
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

  const handleDeleteProduct = async (product) => {
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
          setSaleFromDate("");
          setSaleToDate("");
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
      <div className="min-h-screen bg-white py-8 px-4 mx-auto">Loading...</div>
    );

  return (
    <div className="min-h-screen bg-bg-light py-8 px-4 mx-auto">
      <ResponsiveWidthWrapper>
        <div className="mb-8 flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[250px] p-2 rounded border-2 border-primary/50 bg-white text-dark focus:outline-none focus:border-primary"
          />

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="p-2 rounded border-2 border-primary/50 bg-white text-dark cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">All Products</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="on-sale">On Sale</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mb-8 p-4 bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded">
          <div className="flex flex-col gap-4">
            <button
              onClick={handleDeleteSelected}
              className="px-6 py-2 text-base border-none rounded font-bold bg-red text-light transition-colors hover:bg-red-darker"
            >
              Delete Selected ({selectedIds.size})
            </button>
            <div className="flex gap-4 items-center flex-wrap">
              <input
                type="datetime-local"
                value={saleFromDate}
                onChange={(e) => setSaleFromDate(e.target.value)}
                placeholder="Sale From"
                className="p-2 rounded border-2 border-primary/50 flex-1 min-w-[200px] focus:outline-none focus:border-primary text-dark bg-white"
              />
              <span className="font-bold text-dark">to</span>
              <input
                type="datetime-local"
                value={saleToDate}
                onChange={(e) => setSaleToDate(e.target.value)}
                placeholder="Sale To"
                className="p-2 rounded border-2 border-primary/50 flex-1 min-w-[200px] focus:outline-none focus:border-primary text-dark bg-white"
              />
              <button
                onClick={handleSetSaleDate}
                className="px-6 py-2 text-base border-none rounded font-bold bg-primary text-light transition-colors hover:bg-primary-lighter"
              >
                Set Sale for Selected
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-2 border-primary/20 rounded shadow-[0_0_15px_rgba(0,0,0,0.1)]">
          <div className="hidden md:grid grid-cols-[50px_80px_1fr_220px] gap-4 items-center p-4 bg-primary text-light rounded-t font-bold">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={
                  selectedIds.size === filteredProducts.length &&
                  filteredProducts.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-[18px] h-[18px]"
              />
            </div>
            <div></div>
            <div className="text-left">Products</div>
            <div className="text-left">Actions</div>
          </div>

          <ul className="list-none p-0 m-0 bg-white rounded-b">
            {displayedProducts.map((product) => {
              const thumbnailImage = imagesById.get(product.thumbnailId);
              return (
                <li
                  key={product.id}
                  className={`flex flex-col md:grid md:grid-cols-[50px_80px_1fr_220px] gap-4 items-center p-4 border-b border-primary/10 transition-colors last:border-b-0 hover:bg-bg-grey/30 cursor-pointer ${
                    selectedIds.has(product.id) ? "bg-primary/10" : ""
                  }`}
                  onClick={() => handleEdit(product.id)}
                  title={product.title}
                >
                  <div className="flex md:contents gap-4 items-center w-full md:w-auto">
                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={(e) =>
                          handleSelectProduct(product.id, e.target.checked)
                        }
                        className="w-[18px] h-[18px]"
                      />
                    </div>

                    <div className="w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden shrink-0">
                      {thumbnailImage ? (
                        <img
                          src={thumbnailImage.url}
                          alt={thumbnailImage.alt || "Product thumbnail"}
                          className="w-full h-full object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/image-not-found.png";
                          }}
                        />
                      ) : (
                        <img
                          src="/images/image-not-found.png"
                          alt="No image available"
                          className="w-full h-full object-contain rounded"
                        />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex flex-col gap-1 w-full md:w-auto">
                    <h3 className="m-0 text-base font-semibold text-dark">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-xl text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="px-2 py-1 rounded-xl text-xs font-semibold uppercase tracking-wide whitespace-nowrap bg-primary text-light">
                        Stock: {product.stock || 0}
                      </span>
                      {isProductOnSale(product) && (
                        <span className="px-2 py-1 rounded-xl text-xs font-semibold uppercase tracking-wide whitespace-nowrap bg-yellow text-dark">
                          On Sale
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex gap-2 w-full md:w-auto pointer-events-none [&>*]:pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="flex-1 md:flex-none px-4 py-2 text-sm bg-primary text-light border-none rounded font-bold transition-colors hover:bg-primary-lighter"
                    >
                      Duplicate
                    </button>
                    <ButtonSquare
                      onClick={() => handleDeleteProduct(product)}
                      className="bg-red hover:bg-red-darker"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ButtonSquare>
                  </div>
                </li>
              );
            })}
          </ul>

          {filteredProducts.length === 0 && (
            <p className="py-12 text-center text-gray-400 text-xl bg-white border border-gray-300 rounded">
              No products found
            </p>
          )}

          {hasMoreProducts && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleLoadMore}>
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

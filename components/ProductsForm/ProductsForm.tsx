"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faX } from "@fortawesome/free-solid-svg-icons";
import productFormFields from "@/data/productFormFields";
import CategoryPokemon from "./CategoryFields/CategoryPokemon";
import Category3DPrinted from "./CategoryFields/Category3DPrinted";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import Button from "@/components/Button/Button";
import { useImages } from "@/context/ImagesContext";
import CategoryList from "@/components/CategoryList/CategoryList";
import { useProducts } from "@/context/ProductsContext";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import useImageSearch from "@/hooks/useImageSearch";
import useVariantSearch from "@/hooks/useVariantSearch";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextarea";
import Alert from "@/components/Alert/Alert";
import { SectionCard, FieldLabel } from "./SectionCard";
import type { Product } from "@/types/product";

interface ImagePreview {
  id: string;
  title: string;
  alt: string;
  url: string;
}

// ─── toggle-switch helper ─────────────────────────────────────────────────────
const Toggle = ({
  id,
  name,
  checked,
  label,
  sub,
  color = "bg-primary",
  onChange,
}: {
  id: string;
  name: string;
  checked: boolean;
  label: string;
  sub: string;
  color?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div className="relative shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? color : "bg-gray-200"}`}
      />
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
    <div>
      <p className="text-sm font-semibold text-dark leading-tight">{label}</p>
      <p className="text-xs text-dark/45 leading-tight">{sub}</p>
    </div>
  </label>
);

const ProductsForm = () => {
  const { id } = useParams();
  const { images } = useImages();
  const { products } = useProducts();
  const [formData, setFormData] = useState(productFormFields);
  const [categories, setCategories] = useState([]);
  const [thumbnailQuery, setThumbnailQuery] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<ImagePreview | null>(
    null,
  );
  const [imagesQuery, setImagesQuery] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [variantsQuery, setVariantsQuery] = useState("");
  const [variantsPreviews, setVariantsPreviews] = useState([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [inEditMode, setIsInEditMode] = useState(false);
  const [alert, setAlert] = useState(null);

  // Load product data when editing
  useEffect(() => {
    if (id && products.length) {
      const product = products.find((p) => p.id === id);
      if (product) {
        // Convert arrays to comma-separated strings for form display
        const productForForm = structuredClone(product) as unknown as Record<
          string,
          unknown
        >;

        if (Array.isArray(productForForm.materials)) {
          productForForm.materials = (
            productForForm.materials as string[]
          ).join(", ");
        }
        if (Array.isArray(productForForm.colors)) {
          productForForm.colors = (productForForm.colors as string[]).join(
            ", ",
          );
        }
        if (Array.isArray(productForForm.searchKeywords)) {
          productForForm.searchKeywords = (
            productForForm.searchKeywords as string[]
          ).join(", ");
        }

        // Use setTimeout to defer state updates and avoid cascading renders
        const timer = setTimeout(() => {
          setIsInEditMode(true);
          setFormData(productForForm as unknown as typeof productFormFields);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [id, products]);

  // Build lookup maps for O(1) access (memoized)
  const imagesById = useMemo(() => {
    const m = new Map();
    images.forEach((i) => m.set(i.id, i));
    return m;
  }, [images]);

  const productsById = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  // Fetch Images from formData and populate previews
  useEffect(() => {
    if (!images.length && !products.length) return; // Wait until images are loaded

    // Only run if there's something to preview (thumbnail, images or variants)
    const hasThumbnail = !!formData.thumbnailId;
    const hasImages =
      Array.isArray(formData.imageIds) && formData.imageIds.length > 0;
    const hasVariants =
      Array.isArray(formData.variants) && formData.variants.length > 0;

    if (!hasThumbnail && !hasImages && !hasVariants) return;

    const findPreviewThumbnail = (images) => {
      const previewThumbnail = images.find(
        (image) => image.id === formData.thumbnailId,
      );
      setThumbnailPreview(previewThumbnail || "");
    };

    const findPreviewImages = (images) => {
      // Map imageIds to preserve order instead of using filter
      const previewImages = Array.isArray(formData.imageIds)
        ? formData.imageIds
            .map((id) => images.find((image) => image.id === id))
            .filter(Boolean)
        : [];
      setImagePreviews(previewImages);
    };

    const findPreviewVariants = (variants) => {
      const previewVariants = variants.filter(
        (variant) =>
          Array.isArray(formData.variants) &&
          formData.variants.includes(variant.id),
      );
      setVariantsPreviews(previewVariants);
    };

    findPreviewThumbnail(images);
    findPreviewImages(images);
    findPreviewVariants(products);
  }, [
    images,
    products,
    formData.thumbnailId,
    formData.imageIds,
    formData.variants,
  ]);

  // Prefill previews when editing an existing product (do not overwrite user previews)
  useEffect(() => {
    if (!images.length && !products.length) return;

    // Only run for existing product (has id)
    if (!formData || !formData.id) return;

    // Thumbnail: only set if preview is empty and formData provides an id
    if (!thumbnailPreview && formData.thumbnailId) {
      const img = images.find((i) => i.id === formData.thumbnailId) || null;
      if (img) setTimeout(() => setThumbnailPreview(img), 0);
    }

    // Images: only set if previews empty and formData has ids (preserve order from imageIds)
    if (
      Array.isArray(formData.imageIds) &&
      formData.imageIds.length > 0 &&
      imagePreviews.length === 0
    ) {
      // Map imageIds to preserve order instead of using filter
      const imgs = formData.imageIds
        .map((id) => images.find((img) => img.id === id))
        .filter(Boolean);
      if (imgs.length) setTimeout(() => setImagePreviews(imgs), 0);
    }

    // Variants: only set if previews empty and formData has variant ids
    if (
      Array.isArray(formData.variants) &&
      formData.variants.length > 0 &&
      variantsPreviews.length === 0
    ) {
      const vars = Array.isArray(formData.variants)
        ? formData.variants.map((id) => productsById.get(id)).filter(Boolean)
        : [];
      if (vars.length) setTimeout(() => setVariantsPreviews(vars), 0);
    }
  }, [
    formData,
    images,
    products,
    thumbnailPreview,
    imagePreviews.length,
    variantsPreviews.length,
    imagesById,
    productsById,
  ]);

  // Fetch All Categories
  useEffect(() => {
    const q = query(collection(database, "categories"), orderBy("name"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });

    return () => unsubscribe();
  }, []);

  // Generate Slug based of the title
  const createSlug = (str) =>
    str
      .toLowerCase() // Convert everything to lowercase
      .trim() // Remove whitespace at start and end
      .replace(/[\s,.=!?]+/g, "-") // Replace spaces, commas, dots, equal signs, ! and ? with a dash
      .replace(/[^a-z0-9-]/g, "") // Remove any remaining characters that are NOT: a–z, 0-9, dash (-)
      .replace(/-+/g, "-") // Convert multiple consecutive dashes into a single dash
      .replace(/^-+|-+$/g, ""); // Remove any dashes at the start or end

  // ---------------------------------------------------------------------------------------------
  // THUMBNAIL search (memoized via hook)
  const filteredImagesThumbnail = useImageSearch(images, thumbnailQuery, 10);
  const thumbnailImagesDropdownList = thumbnailQuery
    ? filteredImagesThumbnail
    : filteredImagesThumbnail;

  // Shared fallback for broken images
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/image-not-found.png";
  };

  // Set the thumbnail image preview
  const handleSetThumbnailPreview = (image) => {
    setThumbnailPreview(image);
    setThumbnailQuery("");
    // Keep formData.thumbnailId in sync
    setFormData((prev) => ({ ...prev, thumbnailId: image.id }));
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData((prev) => ({ ...prev, thumbnailId: "" }));
  };

  // ---------------------------------------------------------------------------------------------
  // IMAGES search
  const filteredImages = useImageSearch(images, imagesQuery, 10);
  const imagesDropdownList = imagesQuery ? filteredImages : filteredImages;

  // Set the images preview
  const handleSetImagesPreview = (image) => {
    setImagePreviews((prev) => {
      // If image already exists, return previous array unchanged
      if (prev.some((img) => img.id === image.id)) {
        return prev;
      }

      // Otherwise add it
      return [...prev, image];
    });

    // Also add id to formData.imageIds so form state stores only ids
    setFormData((prev) => {
      const prevIds = Array.isArray(prev.imageIds) ? prev.imageIds : [];
      if (prevIds.includes(image.id)) return prev;
      return { ...prev, imageIds: [...prevIds, image.id] };
    });

    setImagesQuery("");
  };

  // Remove Image from preview
  const handleRemovePreviewImage = (variant) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== variant.id));
    // Also remove id from formData.imageIds
    setFormData((prev) => ({
      ...prev,
      imageIds: (Array.isArray(prev.imageIds) ? prev.imageIds : []).filter(
        (id) => id !== variant.id,
      ),
    }));
  };

  // ---------------------------------------------------------------------------------------------
  // VARIANTS search
  const filteredVariants = useVariantSearch(products, variantsQuery, 10);
  const variantsDropdownList = variantsQuery
    ? filteredVariants
    : filteredVariants;

  // Set the variants preview
  const handleSetVariantsPreview = (variant) => {
    setVariantsPreviews((prev) => {
      // If image already exists, return previous array unchanged
      if (prev.some((vari) => vari.id === variant.id)) {
        return prev;
      }

      // Otherwise add it
      return [...prev, variant];
    });

    setVariantsQuery("");
    // Also keep formData.variants (ids) in sync so submit and preview logic align
    setFormData((prev) => {
      const prevIds = Array.isArray(prev.variants) ? prev.variants : [];
      if (prevIds.includes(variant.id)) return prev;
      return { ...prev, variants: [...prevIds, variant.id] };
    });
  };

  // Remove Variant from preview
  const handleRemovePreviewVariant = (variant) => {
    setVariantsPreviews((prev) =>
      prev.filter((vari) => vari.id !== variant.id),
    );
    // Also remove from formData.variants
    setFormData((prev) => ({
      ...prev,
      variants: (Array.isArray(prev.variants) ? prev.variants : []).filter(
        (id) => id !== variant.id,
      ),
    }));
  };

  const getImageById = useCallback(
    (id) => imagesById.get(id) || null,
    [imagesById],
  );

  // ---------------------------------------------------------------------------------------------

  // Add Color/Grams field on 3d Prints
  const handleAddColor = () => {
    setFormData((prev) => ({
      ...prev,
      printedModel: {
        ...prev.printedModel,
        printColors: [
          ...prev.printedModel.printColors,
          { filamentId: "", grams: "" },
        ],
      },
    }));
  };

  // Remove Color/Grams field on 3d Prints
  const handleRemoveColor = (index) => {
    if (formData.printedModel.printColors.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      printedModel: {
        ...prev.printedModel,
        printColors: prev.printedModel.printColors.filter(
          (_, i) => i !== index,
        ),
      },
    }));
  };

  // Handle Change
  const handleFieldChange = (name, value) => {
    handleChange({ target: { name, value } });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    const keys = name.split("."); // ex: ["printedModel", "printColors", "0", "color"]

    setFormData((prev) => {
      const updated = structuredClone(prev);
      let curr = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        // If key is numeric -> treat as array index
        const isArrayIndex = !isNaN(key);

        if (isArrayIndex) {
          curr = curr[Number(key)];
        } else {
          // Ensure nested object exists
          if (!curr[key]) {
            curr[key] = {};
          }
          curr = curr[key];
        }
      }

      const lastKey = keys[keys.length - 1];

      // For the final key (could be array index or object property)
      if (!isNaN(lastKey)) {
        curr[Number(lastKey)] = finalValue;
      } else {
        curr[lastKey] = finalValue;
      }

      // Auto-generate slug whenever title changes
      if (name === "title") {
        updated.slug = createSlug(finalValue);
      }

      return updated;
    });
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = structuredClone(formData);

      // Normalize images/variants from previews (if present)
      payload.thumbnailId =
        thumbnailPreview?.id ||
        payload.thumbnailId ||
        (payload.isTempFill ? "__placeholder__" : "");
      payload.imageIds =
        imagePreviews?.map((i) => i.id) || payload.imageIds || [];
      payload.variants =
        variantsPreviews?.map((v) => v.id) || payload.variants || [];

      // Convert comma-separated strings to arrays
      const p: any = payload;
      if (typeof p.materials === "string" && p.materials.trim()) {
        p.materials = p.materials
          .split(",")
          .map((m: string) => m.trim())
          .filter(Boolean);
      } else if (!Array.isArray(p.materials)) {
        p.materials = [];
      }

      if (typeof p.colors === "string" && p.colors.trim()) {
        p.colors = p.colors
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean);
      } else if (!Array.isArray(p.colors)) {
        p.colors = [];
      }

      if (typeof p.searchKeywords === "string" && p.searchKeywords.trim()) {
        p.searchKeywords = p.searchKeywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean);
      } else if (!Array.isArray(p.searchKeywords)) {
        p.searchKeywords = [];
      }

      // Persist to Firestore
      if (p.id) {
        // Remove createdAt from payload to preserve the original server timestamp
        const { createdAt, ...updatePayload } = p;
        await setDoc(
          doc(database, "products", updatePayload.id),
          { ...updatePayload, updatedAt: serverTimestamp() },
          { merge: true },
        );
        setAlert({
          alertMessage: "Product updated Successfully!",
          type: "success",
        });
      } else {
        await addDoc(collection(database, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setAlert({
          alertMessage: "Product created successfully",
          type: "success",
        });

        // Only reset form when creating a new product
        setFormData(productFormFields);
        setThumbnailPreview(null);
        setImagePreviews([]);
        setVariantsPreviews([]);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      setAlert({
        alertMessage: "Error saving product: " + (err?.message || err),
        type: "error",
      });
    }
  };

  return (
    <ResponsiveWidthWrapper classNameWrapper={"bg-bg-light"}>
      <form
        className="w-full max-w-3xl mx-auto flex flex-col py-10 gap-6"
        onSubmit={handleSubmit}
      >
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="pb-4 border-b-2 border-primary/20">
          <h1 className="text-3xl font-black text-primary tracking-tight">
            {inEditMode ? "Edit Product" : "New Product"}
          </h1>
          <p className="mt-1 text-sm text-dark/45">
            Fill in each section — all changes are saved when you submit.
          </p>
        </div>

        {/* ── 1. Status & Visibility ──────────────────────────────────────── */}
        <SectionCard step={1} title="Status & Visibility">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
            <Toggle
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              label="Active"
              sub="Visible in the store"
              onChange={handleChange}
            />
            <Toggle
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              label="Featured"
              sub="Shown on the homepage"
              onChange={handleChange}
            />
            <Toggle
              id="isTempFill"
              name="isTempFill"
              checked={formData.isTempFill || false}
              label="Temp Fill"
              sub="Orders only — hidden from store"
              color="bg-yellow-400"
              onChange={handleChange}
            />
          </div>

          {/* Sale Period */}
          <div className="flex flex-col gap-2">
            <FieldLabel>
              Sale Period{" "}
              <span className="font-normal normal-case">(optional)</span>
            </FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-dark/40">From</span>
                <input
                  type="datetime-local"
                  id="sale.from"
                  name="sale.from"
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-primary/20 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.sale?.from || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-dark/40">To</span>
                <input
                  type="datetime-local"
                  id="sale.to"
                  name="sale.to"
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-primary/20 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.sale?.to || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Basic Info ───────────────────────────────────────────────── */}
        <SectionCard step={2} title="Basic Info">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <FormInput
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="#0001 | Bulbasaur - N3D Ball"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <span className="text-xs bg-gray-100 text-dark/40 px-2 py-0.5 rounded-full font-normal normal-case">
                auto-generated
              </span>
            </div>
            <FormInput
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="auto-generated from title"
              disabled
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Categories</FieldLabel>
            <div>
              <Button onClick={() => setShowCategoriesModal(true)}>
                Select Categories
              </Button>
              {showCategoriesModal && (
                <CategoryList
                  categories={formData.categories}
                  setCategories={(newCategories: string[]) =>
                    setFormData((prev) => ({
                      ...prev,
                      categories: newCategories,
                    }))
                  }
                  setShowModal={setShowCategoriesModal}
                />
              )}
              {formData.categories?.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {formData.categories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    if (!cat) return null;
                    const parent = cat.parentId
                      ? categories.find((c) => c.id === cat.parentId)
                      : null;
                    return (
                      <span
                        key={catId}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {parent ? `${parent.name} › ${cat.name}` : cat.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Pricing ──────────────────────────────────────────────────── */}
        <SectionCard step={3} title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="price">
                Price <span className="font-normal normal-case">(kr)</span>
              </FieldLabel>
              <FormInput
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                min={0}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="priceOnSale">
                Sale Price <span className="font-normal normal-case">(kr)</span>
              </FieldLabel>
              <FormInput
                type="number"
                id="priceOnSale"
                name="priceOnSale"
                value={formData.priceOnSale}
                onChange={handleChange}
                placeholder="0"
                min={0}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="costPrice">
                Cost Price <span className="font-normal normal-case">(kr)</span>
              </FieldLabel>
              <FormInput
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                placeholder="0"
                step="0.1"
                min={0}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 4. Inventory ────────────────────────────────────────────────── */}
        <SectionCard step={4} title="Inventory">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Stock */}
            <div className="flex flex-col gap-1">
              <FieldLabel>Stock</FieldLabel>
              <div className="flex rounded-lg overflow-hidden border-2 border-primary/30">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-lighter transition-colors"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      stock: Math.max((prev.stock || 0) - 1, 0),
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  className="flex-1 text-center py-2 px-3 border-x-2 border-primary/20 bg-white focus:outline-none"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min={0}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-lighter transition-colors"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      stock: (prev.stock || 0) + 1,
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Units Sold */}
            <div className="flex flex-col gap-1">
              <FieldLabel>Units Sold</FieldLabel>
              <div className="flex rounded-lg overflow-hidden border-2 border-primary/30">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-lighter transition-colors"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      unitsSold: Math.max((prev.unitsSold || 0) - 1, 0),
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  id="unitsSold"
                  name="unitsSold"
                  className="flex-1 text-center py-2 px-3 border-x-2 border-primary/20 bg-white focus:outline-none"
                  value={formData.unitsSold}
                  onChange={handleChange}
                  placeholder="0"
                  min={0}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-lighter transition-colors"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      unitsSold: (prev.unitsSold || 0) + 1,
                    }))
                  }
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 5. Description ──────────────────────────────────────────────── */}
        <SectionCard step={5} title="Description">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="descriptionMarkdown">
              Content{" "}
              <span className="font-normal normal-case">(Markdown)</span>
            </FieldLabel>
            <FormTextarea
              name="descriptionMarkdown"
              id="descriptionMarkdown"
              value={formData.descriptionMarkdown}
              onChange={handleChange}
              rows={20}
            />
          </div>
        </SectionCard>

        {/* ── 6. Media ────────────────────────────────────────────────────── */}
        <SectionCard step={6} title="Media">
          {/* Thumbnail */}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="thumbnailImageUrl">Thumbnail Image</FieldLabel>
            <div className="relative">
              <FormInput
                type="text"
                id="thumbnailImageUrl"
                name="thumbnailImageUrl"
                value={thumbnailQuery}
                onChange={(e) => setThumbnailQuery(e.target.value)}
                placeholder="Search for thumbnail image..."
              />
              {thumbnailQuery && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-72 overflow-y-auto">
                  {thumbnailImagesDropdownList.map((image) => (
                    <li
                      key={image.id}
                      onClick={() => handleSetThumbnailPreview(image)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 cursor-pointer border-b last:border-0 border-gray-50"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md shrink-0"
                        onError={handleImgError}
                      />
                      <p className="text-sm truncate">{image.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {thumbnailPreview && (
              <div className="relative w-40 group mt-1">
                <Image
                  src={thumbnailPreview.url}
                  alt={thumbnailPreview.alt}
                  width={400}
                  height={400}
                  className="w-full h-auto object-cover rounded-lg border border-gray-200"
                  onError={handleImgError}
                />
                <p className="mt-1 text-xs text-dark/50 truncate">
                  {thumbnailPreview.title}
                </p>
                <button
                  type="button"
                  className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-red text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-darker"
                  onClick={handleRemoveThumbnail}
                >
                  <FontAwesomeIcon icon={faX} className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="imageUrls">Gallery Images</FieldLabel>
            <div className="relative">
              <FormInput
                type="text"
                id="imageUrls"
                name="imageUrls"
                value={imagesQuery}
                onChange={(e) => setImagesQuery(e.target.value)}
                placeholder="Search for images..."
              />
              {imagesQuery && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-72 overflow-y-auto">
                  {imagesDropdownList.map((image) => (
                    <li
                      key={image.id}
                      onClick={() => handleSetImagesPreview(image)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 cursor-pointer border-b last:border-0 border-gray-50"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md shrink-0"
                        onError={handleImgError}
                      />
                      <p className="text-sm truncate">{image.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {imagePreviews?.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mt-1">
                {imagePreviews.map((image) => (
                  <div
                    className="relative group rounded-lg overflow-hidden border border-gray-200"
                    key={image.id}
                    title={image.title}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={240}
                      height={240}
                      className="w-full h-24 object-cover"
                      onError={handleImgError}
                    />
                    <p className="px-1.5 py-1 text-xs truncate text-dark/60 bg-white">
                      {image.title}
                    </p>
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-red text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-darker"
                      onClick={() => handleRemovePreviewImage(image)}
                    >
                      <FontAwesomeIcon icon={faX} className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 7. Physical Attributes ──────────────────────────────────────── */}
        <SectionCard step={7} title="Physical Attributes">
          {/* Materials */}
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="materials">
              Materials{" "}
              <span className="font-normal normal-case">(comma-separated)</span>
            </FieldLabel>
            <FormInput
              type="text"
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              placeholder="PLA, Metal, Wood, etc."
            />
          </div>

          {/* Size */}
          <div className="flex flex-col gap-2">
            <FieldLabel>
              Size <span className="font-normal normal-case">(mm)</span>
            </FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-dark/40">Width (X)</span>
                <FormInput
                  type="number"
                  id="size.width"
                  name="size.width"
                  value={formData.size.width}
                  onChange={handleChange}
                  placeholder="0"
                  step={0.1}
                  min={0}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-dark/40">Height (Y)</span>
                <FormInput
                  type="number"
                  id="size.height"
                  name="size.height"
                  value={formData.size.height}
                  onChange={handleChange}
                  placeholder="0"
                  step={0.1}
                  min={0.1}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-dark/40">Depth (Z)</span>
                <FormInput
                  type="number"
                  id="size.depth"
                  name="size.depth"
                  value={formData.size.depth}
                  onChange={handleChange}
                  placeholder="0"
                  step={0.1}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Weight + Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="weight">
                Weight <span className="font-normal normal-case">(g)</span>
              </FieldLabel>
              <FormInput
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="0"
                min={0}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="colors">
                Colors{" "}
                <span className="font-normal normal-case">
                  (comma-separated)
                </span>
              </FieldLabel>
              <FormInput
                type="text"
                id="colors"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                placeholder="Red, Blue, Green, etc."
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 8. Variants ─────────────────────────────────────────────────── */}
        <SectionCard step={8} title="Variants">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="variants">Search Related Products</FieldLabel>
            <div className="relative">
              <FormInput
                type="text"
                id="variants"
                name="variants"
                value={variantsQuery}
                onChange={(e) => setVariantsQuery(e.target.value)}
                placeholder="Search for products..."
              />
              {variantsQuery && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-72 overflow-y-auto">
                  {variantsDropdownList.map((variant) => {
                    const img = getImageById(variant.thumbnailId);
                    return (
                      <li
                        key={variant.id}
                        onClick={() => handleSetVariantsPreview(variant)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 cursor-pointer border-b last:border-0 border-gray-50"
                      >
                        <Image
                          src={img?.url || "/images/image-not-found.png"}
                          alt={img?.alt || variant.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-md shrink-0"
                          onError={handleImgError}
                        />
                        <p className="text-sm truncate">{variant.title}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {variantsPreviews?.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mt-1">
                {variantsPreviews.map((variant) => {
                  const img = getImageById(variant.thumbnailId);
                  return (
                    <div
                      className="relative group rounded-lg overflow-hidden border border-gray-200"
                      key={variant.id}
                      title={variant.title}
                    >
                      <Image
                        src={img?.url || "/images/image-not-found.png"}
                        alt={img?.alt || variant.title}
                        width={240}
                        height={240}
                        className="w-full h-24 object-cover"
                        onError={handleImgError}
                      />
                      <p className="px-1.5 py-1 text-xs truncate text-dark/60 bg-white">
                        {variant.title}
                      </p>
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-red text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-darker"
                        onClick={() => handleRemovePreviewVariant(variant)}
                      >
                        <FontAwesomeIcon icon={faX} className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 9. Attribution & Metadata ───────────────────────────────────── */}
        <SectionCard step={9} title="Attribution & Metadata">
          {/* Creator row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="creatorManufacturer">
                Creator / Manufacturer
              </FieldLabel>
              <FormInput
                type="text"
                id="creatorManufacturer"
                name="creatorManufacturer"
                value={formData.creatorManufacturer}
                onChange={handleChange}
                placeholder="Creator or manufacturer name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="creatorManufacturerUrl">
                Creator URL
              </FieldLabel>
              <FormInput
                type="text"
                id="creatorManufacturerUrl"
                name="creatorManufacturerUrl"
                value={formData.creatorManufacturerUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* EAN + Product Code row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="eanBarcode">EAN Barcode</FieldLabel>
              <FormInput
                type="text"
                id="eanBarcode"
                name="eanBarcode"
                value={formData.eanBarcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="productCode">Product Code</FieldLabel>
              <FormInput
                type="text"
                id="productCode"
                name="productCode"
                value={formData.productCode}
                onChange={handleChange}
                placeholder="Short product identifier"
              />
            </div>
          </div>

          {/* Search Keywords */}
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="searchKeywords">
              Search Keywords{" "}
              <span className="font-normal normal-case">(comma-separated)</span>
            </FieldLabel>
            <FormInput
              type="text"
              id="searchKeywords"
              name="searchKeywords"
              value={formData.searchKeywords}
              onChange={handleChange}
              placeholder="Pokemon, Squirtle, Blue, etc."
            />
          </div>
        </SectionCard>

        {/* ── Category-Specific Sections ───────────────────────────────────── */}
        {formData.categories.length > 0 && (
          <div className="pb-1 border-b-2 border-primary/20">
            <h2 className="text-lg font-bold text-primary tracking-tight">
              Category-Specific Data
            </h2>
          </div>
        )}

        {/* POKEMON DATA */}
        {categories.some(
          (cat) =>
            formData.categories.includes(cat.id) && cat.name === "Pokemon",
        ) && (
          <CategoryPokemon formData={formData} handleChange={handleChange} />
        )}

        {/* 3D PRINT DATA */}
        {categories.some(
          (cat) =>
            formData.categories.includes(cat.id) && cat.name === "3D-Printed",
        ) && (
          <Category3DPrinted
            formData={formData as any}
            handleChange={handleChange}
            handleFieldChange={handleFieldChange}
            handleAddColor={handleAddColor}
            handleRemoveColor={handleRemoveColor}
          />
        )}

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <button
          type="submit"
          className="sticky bottom-4 z-50 w-full py-4 rounded-xl border border-primary-darker text-light font-bold bg-primary shadow-[0_4px_20px_rgba(17,62,83,0.45)] hover:bg-primary-lighter transition-colors active:scale-[0.99]"
        >
          <span className="text-base tracking-wide">
            {inEditMode ? "Save Changes" : "Create Product"}
          </span>
        </button>
      </form>

      {/* Alert */}
      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={4000}
          onClose={() => setAlert(null)}
        />
      )}
    </ResponsiveWidthWrapper>
  );
};

export default ProductsForm;

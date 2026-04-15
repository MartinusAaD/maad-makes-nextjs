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
import ButtonSquare from "@/components/ButtonSquare/ButtonSquare";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import useImageSearch from "@/hooks/useImageSearch";
import useVariantSearch from "@/hooks/useVariantSearch";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextarea";
import FormSelect from "@/components/Form/FormSelect";
import FormFieldset from "@/components/Form/FormFieldset";
import Alert from "@/components/Alert/Alert";
import type { Product } from "@/types/product";

interface ImagePreview {
  id: string;
  title: string;
  alt: string;
  url: string;
}

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
        className="w-full flex flex-col justify-center items-center py-8 gap-8"
        onSubmit={handleSubmit}
      >
        <h1 className="text-4xl font-bold">
          {inEditMode ? "Update Product" : "Add Product"}
        </h1>

        <FormFieldset legend={"Tools"}>
          {/* Tools, isActive, isFeatured */}
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col flex-wrap gap-8">
              {/* isActive */}
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  className="w-6 h-6 accent-primary"
                  checked={formData.isActive}
                  onChange={handleChange}
                  title="Check if product is active"
                />
                <label
                  htmlFor="isActive"
                  className="font-bold"
                  title="Check if product is active"
                >
                  Check if Active
                </label>
              </div>

              {/* isFeatured */}
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  className="w-6 h-6 accent-primary"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  title="Check if product is featured"
                />
                <label
                  htmlFor="isFeatured"
                  className="font-bold"
                  title="Check if product is featured"
                >
                  Check if Featured
                </label>
              </div>

              {/* isTempFill */}
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  id="isTempFill"
                  name="isTempFill"
                  className="w-6 h-6 accent-yellow-500"
                  checked={formData.isTempFill || false}
                  onChange={handleChange}
                  title="Temporary fill product — hidden from store and home, only usable in orders"
                />
                <label
                  htmlFor="isTempFill"
                  className="font-bold"
                  title="Temporary fill product — hidden from store and home, only usable in orders"
                >
                  Temporary Fill Product
                </label>
              </div>
            </div>

            {/* Sale date range - always visible */}
            <div className="w-full flex flex-col gap-1">
              <label htmlFor="sale.from" className="font-bold">
                On Sale Period (optional):
              </label>
              <div className="flex justify-between gap-2">
                <input
                  type="datetime-local"
                  id="sale.from"
                  name="sale.from"
                  className="w-full p-2 rounded border-2 border-primary/50"
                  value={formData.sale?.from || ""}
                  onChange={handleChange}
                  placeholder="Start date"
                />
                <input
                  type="datetime-local"
                  id="sale.to"
                  name="sale.to"
                  className="w-full p-2 rounded border-2 border-primary/50"
                  value={formData.sale?.to || ""}
                  onChange={handleChange}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </FormFieldset>

        <FormFieldset legend="General Data">
          {/* Title */}
          <FormGroup>
            <FormLabel htmlFor="title" title="Enter the products title">
              Title:
            </FormLabel>
            <FormInput
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              title="Enter the products title"
              placeholder="#0001 | Bulbasaur - N3D Ball"
            />
          </FormGroup>

          {/* Slug */}
          <FormGroup>
            <FormLabel
              htmlFor="slug"
              title="The slug is the part of the url specific for this product"
            >
              Slug:
            </FormLabel>
            <FormInput
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              title="The slug is the part of the url specific for this product"
              placeholder="Auto-generated based on the title"
              disabled
            />
          </FormGroup>

          {/* Categories */}
          <FormGroup>
            <FormLabel
              htmlFor="categories"
              title="Enter the categories of the product"
            >
              Categories:
            </FormLabel>
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
              {/* Display selected category names as pills */}
              {formData.categories?.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  Selected:
                  {formData.categories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    if (!cat) return null;

                    // Find parent category if this is a subcategory
                    const parent = cat.parentId
                      ? categories.find((c) => c.id === cat.parentId)
                      : null;

                    return (
                      <span
                        key={catId}
                        className="bg-blue-100 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        {parent ? `${parent.name} > ${cat.name}` : cat.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </FormGroup>

          {/* Price */}
          <FormGroup>
            <FormLabel
              htmlFor="price"
              title="The Price the product is being sold for"
            >
              Price: {"(kr)"}
            </FormLabel>
            <FormInput
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              title="The Price the product is being sold for"
              placeholder="0"
              min={0}
            />
          </FormGroup>

          {/* Price on Sale */}
          <FormGroup>
            <FormLabel
              htmlFor="priceOnSale"
              title="The Price the product will be sold for on Sale"
            >
              Price on Sale: {"(kr)"}
            </FormLabel>
            <FormInput
              type="number"
              id="priceOnSale"
              name="priceOnSale"
              value={formData.priceOnSale}
              onChange={handleChange}
              title="The Price the product will be sold for on Sale"
              placeholder="0"
              min={0}
            />
          </FormGroup>

          {/* Cost Price */}
          <FormGroup>
            <FormLabel
              htmlFor="costPrice"
              title="The Cost to create or buy the product for the seller"
            >
              Cost Price: {"(kr)"}
            </FormLabel>
            <FormInput
              type="number"
              id="costPrice"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              title="The Cost to create or buy the product for the seller"
              placeholder="0"
              step="0.1"
              min={0}
            />
          </FormGroup>

          {/* Stock */}
          <FormGroup>
            <FormLabel
              htmlFor="stock"
              title="The amount of product on hand right now, or amount of grams if filament"
            >
              Stock:
            </FormLabel>
            <div className="flex gap-2">
              <button
                type="button"
                className="w-1/2 p-1 rounded border-2 border-primary/30 text-light font-bold bg-primary hover:bg-primary-lighter active:[&>svg]:scale-85"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    stock: Math.max((prev.stock || 0) - 1, 0),
                  }))
                }
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <FormInput
                type="number"
                id="stock"
                name="stock"
                className="text-center"
                value={formData.stock}
                onChange={handleChange}
                title="The amount of product on hand right now, or amount of grams if filament"
                placeholder="0"
                min={0}
              />
              <button
                type="button"
                className="w-1/2 p-1 rounded border-2 border-primary/30 text-light font-bold bg-primary hover:bg-primary-lighter active:[&>svg]:scale-85"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    stock: (prev.stock || 0) + 1,
                  }))
                }
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </FormGroup>

          {/* Units Sold */}
          <FormGroup>
            <FormLabel htmlFor="unitsSold" title="The amount of product sold!">
              Units Sold:
            </FormLabel>
            <div className="flex gap-2">
              <button
                type="button"
                className="w-1/2 p-1 rounded border-2 border-primary/30 text-light font-bold bg-primary hover:bg-primary-lighter active:[&>svg]:scale-85"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    unitsSold: Math.max((prev.unitsSold || 0) - 1, 0),
                  }))
                }
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <FormInput
                type="number"
                id="unitsSold"
                name="unitsSold"
                className="text-center"
                value={formData.unitsSold}
                onChange={handleChange}
                title="The amount of product sold!"
                placeholder="0"
                min={0}
              />
              <button
                type="button"
                className="w-1/2 p-1 rounded border-2 border-primary/30 text-light font-bold bg-primary hover:bg-primary-lighter active:[&>svg]:scale-85"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    unitsSold: (prev.unitsSold || 0) + 1,
                  }))
                }
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </FormGroup>

          {/* Description Markdown */}
          <FormGroup>
            <FormLabel
              htmlFor="descriptionMarkdown"
              title="Enter the products description here with the MarkDown markup language!"
            >
              Description:
            </FormLabel>
            <FormTextarea
              name="descriptionMarkdown"
              id="descriptionMarkdown"
              value={formData.descriptionMarkdown}
              onChange={handleChange}
              title="Enter the products description here with the MarkDown markup language!"
              rows={20}
            />
          </FormGroup>

          {/* Thumbnail Image */}
          <FormGroup>
            <FormLabel htmlFor="thumbnailImageUrl">Thumbnail Image:</FormLabel>

            <FormInput
              type="text"
              id="thumbnailImageUrl"
              name="thumbnailImageUrl"
              value={thumbnailQuery}
              onChange={(e) => setThumbnailQuery(e.target.value)}
              title="Uploaded image is the main image of the product"
              placeholder="Search for Thumbnail Image"
            />

            {thumbnailQuery && (
              <ul className="flex flex-col gap-2 max-h-85 overflow-y-auto p-2 bg-light border-2 border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded">
                {thumbnailImagesDropdownList.map((image) => (
                  <li
                    key={image.id}
                    onClick={() => handleSetThumbnailPreview(image)}
                    className="flex items-center gap-4 rounded p-2 hover:bg-primary/10 cursor-pointer"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={100}
                      height={100}
                      className="max-w-25 h-auto rounded"
                      onError={handleImgError}
                    />
                    <p>{image.title}</p>
                  </li>
                ))}
              </ul>
            )}

            {thumbnailPreview && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 w-full">
                <div
                  className="relative flex flex-col gap-1 bg-light p-2 rounded border border-primary/10 transition-all"
                  title={thumbnailPreview.title}
                >
                  <Image
                    src={thumbnailPreview.url}
                    alt={thumbnailPreview.alt}
                    width={400}
                    height={400}
                    className="max-w-100 h-auto object-cover rounded"
                    onError={handleImgError}
                  />
                  <p className="whitespace-nowrap overflow-hidden">
                    {thumbnailPreview?.title}
                  </p>
                  <button
                    className="flex justify-center items-center absolute top-0 right-0 m-2 w-7.5 h-7.5 rounded border-none bg-red text-light hover:bg-red-darker active:[&>svg]:scale-85"
                    onClick={handleRemoveThumbnail}
                  >
                    <FontAwesomeIcon icon={faX} />
                  </button>
                </div>
              </div>
            )}
          </FormGroup>

          {/* Images */}
          <FormGroup>
            <FormLabel htmlFor="imagesUrl">Images:</FormLabel>

            <FormInput
              type="text"
              id="imageUrls"
              name="imageUrls"
              value={imagesQuery}
              onChange={(e) => setImagesQuery(e.target.value)}
              title="Uploaded images are displayed on the products page"
              placeholder="Search for Images"
            />

            {imagesQuery && (
              <ul className="flex flex-col gap-2 max-h-85 overflow-y-auto p-2 bg-light border-2 border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded">
                {imagesDropdownList.map((image) => (
                  <li
                    key={image.id}
                    onClick={() => handleSetImagesPreview(image)}
                    className="flex items-center gap-4 rounded p-2 hover:bg-primary/10 cursor-pointer"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={100}
                      height={100}
                      className="max-w-25 h-auto rounded"
                      onError={handleImgError}
                    />
                    <p>{image.title}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 w-full">
              {imagePreviews?.map((image) => (
                <div
                  className="relative flex flex-col gap-1 bg-light p-2 rounded border border-primary/10 transition-all"
                  key={image.id}
                  title={image.title}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={400}
                    height={400}
                    className="max-w-100 h-auto object-cover rounded"
                    onError={handleImgError}
                  />
                  <p className="whitespace-nowrap overflow-hidden">
                    {image.title}
                  </p>
                  <button
                    className="flex justify-center items-center absolute top-0 right-0 m-2 w-7.5 h-7.5 rounded border-none bg-red text-light hover:bg-red-darker active:[&>svg]:scale-85"
                    onClick={() => handleRemovePreviewImage(image)}
                  >
                    <FontAwesomeIcon icon={faX} />
                  </button>
                </div>
              ))}
            </div>
          </FormGroup>

          {/* Materials */}
          <FormGroup>
            <FormLabel
              htmlFor="materials"
              title="Seperate with commas! - PLA, Metal, Wood, etc"
            >
              Materials:
            </FormLabel>

            <FormInput
              type="text"
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              title="Seperate with commas! - PLA, Metal, Wood, etc"
              placeholder="Seperate with commas! - PLA, Metal, Wood, etc"
            />
          </FormGroup>

          {/* Size */}
          <FormGroup>
            <FormLabel
              htmlFor="size"
              title="Enter the total size of the product"
            >
              Size: {"(mm)"}
            </FormLabel>
            <div className="flex flex-col gap-2">
              <FormInput
                type="number"
                id="size.width"
                name="size.width"
                value={formData.size.width}
                onChange={handleChange}
                placeholder="Width - X"
                title="Enter the products width"
                step={0.1}
                min={0}
              />
              <FormInput
                type="number"
                id="size.height"
                name="size.height"
                value={formData.size.height}
                onChange={handleChange}
                placeholder="Height - Y"
                title="Enter the products height"
                step={0.1}
                min={0.1}
              />
              <FormInput
                type="number"
                id="size.depth"
                name="size.depth"
                value={formData.size.depth}
                onChange={handleChange}
                placeholder="Depth - Z"
                title="Enter the products depth"
                step={0.1}
                min={0}
              />
            </div>
          </FormGroup>

          {/* Weight */}
          <FormGroup>
            <FormLabel
              htmlFor="weight"
              title="Enter the products weight in Grams!"
            >
              Weight: {"(g)"}
            </FormLabel>
            <FormInput
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              title="Enter the products weight in Grams!"
              placeholder="Enter the products weight in Grams!"
              min={0}
            />
          </FormGroup>

          {/* Colors */}
          <FormGroup>
            <FormLabel
              htmlFor="colors"
              title="Separate with commas - Red, Blue, Green, etc"
            >
              Colors:
            </FormLabel>
            <FormInput
              type="text"
              id="colors"
              name="colors"
              value={formData.colors}
              onChange={handleChange}
              title="Separate with commas - Red, Blue, Green, etc"
              placeholder="Separate with commas - Red, Blue, Green, etc"
            />
          </FormGroup>

          {/* Variants */}
          <FormGroup>
            <FormLabel
              htmlFor="variants"
              title="These will be listed on the products website"
            >
              Variants:
            </FormLabel>
            <FormInput
              type="text"
              id="variants"
              name="variants"
              value={variantsQuery}
              onChange={(e) => setVariantsQuery(e.target.value)}
              title="These will be listed on the products website"
              placeholder="Search for products ..."
            />
            {variantsQuery && (
              <ul className="flex flex-col gap-2 max-h-85 overflow-y-auto p-2 bg-light border-2 border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded">
                {variantsDropdownList.map((variant) => (
                  <li
                    key={variant.id}
                    onClick={() => handleSetVariantsPreview(variant)}
                    className="flex items-center gap-4 rounded p-2 hover:bg-primary/10 cursor-pointer"
                  >
                    {(() => {
                      const img = getImageById(variant.thumbnailId);
                      return (
                        <Image
                          src={img?.url || "/images/image-not-found.png"}
                          alt={img?.alt || variant.title}
                          width={100}
                          height={100}
                          className="max-w-25 h-auto rounded"
                          onError={handleImgError}
                        />
                      );
                    })()}

                    <p>{variant.title}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 w-full">
              {variantsPreviews?.map((variant) => (
                <div
                  className="relative flex flex-col gap-1 bg-light p-2 rounded border border-primary/10 transition-all"
                  key={variant.id}
                  title={variant.title}
                >
                  {(() => {
                    const img = getImageById(variant.thumbnailId);
                    return (
                      <Image
                        src={img?.url || "/images/image-not-found.png"}
                        alt={img?.alt || variant.title}
                        width={400}
                        height={400}
                        className="max-w-100 h-auto object-cover rounded"
                        onError={handleImgError}
                      />
                    );
                  })()}

                  <p className="whitespace-nowrap overflow-hidden">
                    {variant.title}
                  </p>
                  <button
                    className="flex justify-center items-center absolute top-0 right-0 m-2 w-7.5 h-7.5 rounded border-none bg-red text-light hover:bg-red-darker active:[&>svg]:scale-85"
                    onClick={() => handleRemovePreviewVariant(variant)}
                  >
                    <FontAwesomeIcon icon={faX} />
                  </button>
                </div>
              ))}
            </div>
          </FormGroup>

          {/* Search Keywords */}
          <FormGroup>
            <FormLabel
              htmlFor="searchKeywords"
              title="These keywords will be used to easily find them later! And google visibility... I think?"
            >
              Search Keywords:
            </FormLabel>
            <FormInput
              type="text"
              id="searchKeywords"
              name="searchKeywords"
              value={formData.searchKeywords}
              onChange={handleChange}
              title="These keywords will be used to easily find them later! And google visibility... I think?"
              placeholder="Seperate with commas! Pokemon, Squirtle, Blue, etc..."
            />
          </FormGroup>

          {/* Creator */}
          <FormGroup>
            <FormLabel
              htmlFor="creatorManufacturer"
              title="The creator or manufacturer of the product"
            >
              Creator / Manufacturer:
            </FormLabel>
            <FormInput
              type="text"
              id="creatorManufacturer"
              name="creatorManufacturer"
              value={formData.creatorManufacturer}
              onChange={handleChange}
              title="The creator or manufacturer of the product"
              placeholder="Enter the creator or manufacturers name"
            />
          </FormGroup>

          {/* Creator URL */}
          <FormGroup>
            <FormLabel
              htmlFor="creatorManufacturerUrl"
              title="The URL of creator or manufacturer of the product"
            >
              Creator / Manufacturer URL:
            </FormLabel>
            <FormInput
              type="text"
              id="creatorManufacturerUrl"
              name="creatorManufacturerUrl"
              value={formData.creatorManufacturerUrl}
              onChange={handleChange}
              title="The URL of creator or manufacturer of the product"
              placeholder="Enter the URL of creator or manufacturers name"
            />
          </FormGroup>

          {/* EAN Barcode */}
          <FormGroup>
            <FormLabel htmlFor="eanBarcode" title="The barcode of the product">
              EAN Barcode:
            </FormLabel>
            <FormInput
              type="text"
              id="eanBarcode"
              name="eanBarcode"
              value={formData.eanBarcode}
              onChange={handleChange}
              title="The barcode of the product"
              placeholder="Enter or scan the products barcode"
            />
          </FormGroup>

          {/* Product Code */}
          <FormGroup>
            <FormLabel
              htmlFor="productCode"
              title="The websites product specific identifier, simplified"
            >
              Product Code:
            </FormLabel>
            <FormInput
              type="text"
              id="productCode"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              title="The websites product specific identifier, simplified"
              placeholder="Enter a shorter code for the product"
            />
          </FormGroup>
        </FormFieldset>

        {formData.categories.length > 0 && (
          <div className="w-full flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Category Specific Data</h1>
          </div>
        )}

        {/* POKEMON RELATED DATA */}
        {categories.some(
          (cat) =>
            formData.categories.includes(cat.id) && cat.name === "Pokemon",
        ) && (
          <CategoryPokemon formData={formData} handleChange={handleChange} />
        )}

        {/* 3D Print  Data */}
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

        <button className="sticky bottom-0 z-100 w-full text-base p-4 rounded border border-primary-darker text-light font-bold bg-primary shadow-[0_0_4px_1px_rgba(0,0,0,0.8)] hover:bg-primary-lighter active:[&>p]:scale-90">
          <p className="text-xl">
            {inEditMode ? "Update Product" : "Add Product"}
          </p>
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

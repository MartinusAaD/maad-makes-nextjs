"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { useProducts } from "@/context/ProductsContext";
import { useImages } from "@/context/ImagesContext";
import { useFilaments } from "@/context/FilamentsContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import PokemonType from "@/components/PokemonType/PokemonType";
import Button from "@/components/Button/Button";
import Alert from "@/components/Alert/Alert";
import { isProductOnSale } from "@/utils/productHelpers";
import { trackProductView } from "@/utils/analytics";

export default function ProductPageContent() {
  const { slug } = useParams();
  const router = useRouter();
  const { products, loading } = useProducts();
  const { images } = useImages();
  const { filaments } = useFilaments();
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [alert, setAlert] = useState(null);
  const [openSections, setOpenSections] = useState({
    general: true,
    pokemon: false,
    ball: false,
    print: false,
    filament: false,
  });

  const toggleSection = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const product = products.find((p) => p.slug === slug);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAlert({
      alertMessage: `${product.title} added to cart!`,
      type: "success",
    });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    if (product) trackProductView(product.id, product.title, product.category);
  }, [product]);

  const productImages = useMemo(() => {
    if (!product || !images.length) return [];
    const imagesList = [];
    if (product.thumbnailId) {
      const thumbnail = images.find((img) => img.id === product.thumbnailId);
      if (thumbnail) imagesList.push(thumbnail);
    }
    if (product.imageIds && Array.isArray(product.imageIds)) {
      product.imageIds.forEach((imgId) => {
        if (imgId === product.thumbnailId) return;
        const img = images.find((i) => i.id === imgId);
        if (img) imagesList.push(img);
      });
    }
    return imagesList;
  }, [product, images]);

  const variantProducts = useMemo(() => {
    if (!product || !product.variants || !products.length) return [];
    return products.filter((p) => product.variants.includes(p.id));
  }, [product, products]);

  const getVariantImage = (variantProduct) => {
    if (!variantProduct.thumbnailId) return null;
    return images.find((img) => img.id === variantProduct.thumbnailId);
  };

  const onSale = product ? isProductOnSale(product) : false;

  if (loading) {
    return (
      <div className="py-8 bg-bg-light min-h-screen">
        <ResponsiveWidthWrapper>
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-500">Loading product...</p>
          </div>
        </ResponsiveWidthWrapper>
      </div>
    );
  }

  if (!product || !product.isActive || (product.isTempFill && !isAdmin)) {
    notFound();
  }

  const currentImage = productImages[selectedImageIndex];

  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 mb-8 bg-white p-4 md:p-8 rounded shadow-md">
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-square rounded overflow-hidden border border-bg-grey bg-bg-grey flex items-center justify-center">
              <Image
                src={currentImage?.url || "/images/image-not-found.png"}
                alt={currentImage?.alt || product.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === 0 ? productImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110 z-10"
                    aria-label="Previous image"
                  >
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      className="text-primary text-sm"
                    />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === productImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110 z-10"
                    aria-label="Next image"
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-primary text-sm"
                    />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {productImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === selectedImageIndex
                            ? "bg-primary scale-125"
                            : "bg-white/70 hover:bg-white"
                        }`}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {productImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 border-2 rounded p-0 cursor-pointer bg-white overflow-hidden transition-all flex items-center justify-center hover:border-primary hover:scale-105 ${index === selectedImageIndex ? "border-primary shadow-[0_0_0_2px_rgba(17,62,83,0.2)]" : "border-bg-grey"}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/images/image-not-found.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0">
              <h1 className="text-2xl text-primary m-0 font-bold">
                {product.title}
              </h1>
              {product.productCode && (
                <p className="text-sm text-dark opacity-60 m-0">
                  {product.productCode}
                </p>
              )}
            </div>

            {product.pokemonData?.pokedexEntry && (
              <p className="italic">{`"${product.pokemonData.pokedexEntry}"`}</p>
            )}

            {(product.pokemonData?.typing?.typing1 ||
              product.pokemonData?.typing?.typing2) && (
              <div className="flex gap-2 flex-wrap">
                {product.pokemonData.typing.typing1 && (
                  <PokemonType type={product.pokemonData.typing.typing1} />
                )}
                {product.pokemonData.typing.typing2 && (
                  <PokemonType type={product.pokemonData.typing.typing2} />
                )}
              </div>
            )}

            {product.descriptionMarkdown && (
              <div className="prose max-w-none prose-headings:text-primary prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-a:text-primary">
                <ReactMarkdown>{product.descriptionMarkdown}</ReactMarkdown>
              </div>
            )}

            <div className="flex flex-col gap-4 items-center md:items-end">
              {onSale && product.priceOnSale ? (
                <>
                  <span className="text-xl text-gray-400 line-through font-normal">
                    {Number(product.price || 0)},-
                  </span>
                  <div className="flex flex-col gap-1 items-center md:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-dark bg-yellow px-4 py-2 rounded-4xl whitespace-nowrap">
                        {Number(product.priceOnSale || 0)},-
                      </span>
                      <span className="bg-yellow text-dark px-2 py-1 rounded text-sm font-bold whitespace-nowrap">
                        On Sale!
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">+ Shipping</span>
                  </div>
                  {product.sale?.from &&
                    product.sale?.to &&
                    (() => {
                      const fromDate = new Date(
                        product.sale.from.seconds
                          ? product.sale.from.seconds * 1000
                          : product.sale.from,
                      );
                      const toDate = new Date(
                        product.sale.to.seconds
                          ? product.sale.to.seconds * 1000
                          : product.sale.to,
                      );
                      if (
                        isNaN(fromDate.getTime()) ||
                        isNaN(toDate.getTime())
                      ) {
                        return null;
                      }
                      return (
                        <div className="text-sm text-dark opacity-70">
                          {fromDate.toLocaleDateString("nb-NO", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          {" - "}
                          {toDate.toLocaleDateString("nb-NO", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      );
                    })()}
                </>
              ) : (
                <div className="flex flex-col gap-1 items-center md:items-end">
                  <span className="text-2xl font-bold text-light bg-primary px-4 py-2 rounded-4xl w-fit">
                    {Number(product.price || 0)},-
                  </span>
                  <span className="text-sm text-gray-500">+ Shipping</span>
                </div>
              )}
            </div>

            {alert && (
              <Alert alertMessage={alert.alertMessage} type={alert.type} />
            )}
            <div className="flex flex-col gap-3 items-center md:items-stretch pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <label htmlFor="quantity" className="font-semibold">
                  Quantity:
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded text-center"
                />
              </div>
              <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                <Button onClick={handleAddToCart}>
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  Add to Cart
                </Button>
                <Button onClick={() => router.push("/cart")}>View Cart</Button>
              </div>
            </div>

            {variantProducts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-bg-grey">
                <h3 className="text-2xl text-primary m-0 mb-4 font-bold">
                  Available Variants
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {variantProducts.map((variant) => {
                    const variantImage = getVariantImage(variant);
                    const isActive = variant.slug === slug;
                    return (
                      <Link
                        key={variant.id}
                        href={`/product/${variant.slug}`}
                        className={`flex flex-col gap-1 p-2 border-2 rounded bg-white no-underline transition-all cursor-pointer w-30 hover:border-primary hover:-translate-y-0.5 hover:shadow-md ${isActive ? "border-primary" : "border-bg-grey"}`}
                      >
                        {variantImage ? (
                          <Image
                            src={variantImage.url}
                            alt={variant.title}
                            width={120}
                            height={120}
                            className="w-full aspect-square object-contain rounded bg-bg-grey"
                            onError={(e) => {
                              e.currentTarget.src =
                                "/images/image-not-found.png";
                            }}
                          />
                        ) : (
                          <Image
                            src="/images/image-not-found.png"
                            alt={variant.title}
                            width={120}
                            height={120}
                            className="w-full aspect-square object-contain rounded bg-bg-grey"
                          />
                        )}
                        <span className="text-sm text-dark font-medium text-center leading-tight line-clamp-2">
                          {variant.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {product.printedModel?.printColors?.length > 0 && (
            <div className="col-span-full mt-4">
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm text-gray-700 italic m-0">
                  <strong>Note:</strong> This is a 3D printed item. Up close
                  there are visible layer lines and, slight variations between
                  prints are normal characteristics of 3D printing.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded shadow-md">
          <h2 className="text-3xl text-primary m-0 mb-6 font-bold">
            Product Details
          </h2>

          {(product.materials?.length > 0 ||
            product.weight ||
            product.size?.width ||
            product.size?.height ||
            product.size?.depth ||
            product.colors?.length > 0 ||
            product.brand ||
            product.manufacturer ||
            product.creatorManufacturer ||
            product.eanBarcode ||
            product.productCode) && (
            <div className="border border-bg-grey rounded mb-4 overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-4 bg-primary border-none cursor-pointer text-xl font-bold text-light transition-colors hover:bg-primary-lighter"
                onClick={() => toggleSection("general")}
              >
                <span>General Information</span>
                <FontAwesomeIcon
                  icon={openSections.general ? faChevronUp : faChevronDown}
                />
              </button>
              {openSections.general && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {product.materials?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Materials:
                        </span>
                        <span className="text-xl text-dark">
                          {product.materials.join(", ")}
                        </span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Weight:
                        </span>
                        <span className="text-xl text-dark">
                          {product.weight}g
                        </span>
                      </div>
                    )}
                    {(product.size?.width ||
                      product.size?.height ||
                      product.size?.depth) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Dimensions: (H x W x D)
                        </span>
                        <span className="text-xl text-dark">
                          {[
                            product.size.width,
                            product.size.height,
                            product.size.depth,
                          ]
                            .filter(Boolean)
                            .join("mm × ")}
                          mm
                        </span>
                      </div>
                    )}
                    {product.colors?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Colors:
                        </span>
                        <span className="text-xl text-dark">
                          {product.colors.join(", ")}
                        </span>
                      </div>
                    )}
                    {product.brand && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Brand:
                        </span>
                        <span className="text-xl text-dark">
                          {product.brand}
                        </span>
                      </div>
                    )}
                    {product.manufacturer && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Manufacturer:
                        </span>
                        <span className="text-xl text-dark">
                          {product.manufacturer}
                        </span>
                      </div>
                    )}
                    {product.creatorManufacturer && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Creator / Designer:
                        </span>
                        <span className="text-xl text-dark">
                          {product.creatorManufacturerUrl ? (
                            <a
                              href={product.creatorManufacturerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline hover:opacity-80"
                            >
                              {product.creatorManufacturer}
                            </a>
                          ) : (
                            product.creatorManufacturer
                          )}
                        </span>
                      </div>
                    )}
                    {product.eanBarcode && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          EAN:
                        </span>
                        <span className="text-xl text-dark">
                          {product.eanBarcode}
                        </span>
                      </div>
                    )}
                    {product.productCode && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Product Code:
                        </span>
                        <span className="text-xl text-dark">
                          {product.productCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {(product.pokemonData?.pokemon ||
            product.pokemonData?.pokedexNumber ||
            product.pokemonData?.typing?.typing1 ||
            product.pokemonData?.typing?.typing2 ||
            product.pokemonData?.gender) && (
            <div className="border border-bg-grey rounded mb-4 overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-4 bg-primary border-none cursor-pointer text-xl font-bold text-light transition-colors hover:bg-primary-lighter"
                onClick={() => toggleSection("pokemon")}
              >
                <span>Character Information</span>
                <FontAwesomeIcon
                  icon={openSections.pokemon ? faChevronUp : faChevronDown}
                />
              </button>
              {openSections.pokemon && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {product.pokemonData.pokemon && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Character:
                        </span>
                        <span className="text-xl text-dark">
                          {product.pokemonData.pokemon}
                        </span>
                      </div>
                    )}
                    {product.pokemonData.pokedexNumber && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Number:
                        </span>
                        <span className="text-xl text-dark">
                          {product.pokemonData.pokedexNumber}
                        </span>
                      </div>
                    )}
                    {product.pokemonData.generation && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Generation:
                        </span>
                        <span className="text-xl text-dark">
                          {product.pokemonData.generation}
                        </span>
                      </div>
                    )}
                    {(product.pokemonData.typing?.typing1 ||
                      product.pokemonData.typing?.typing2) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Type:
                        </span>
                        <span className="text-xl text-dark">
                          {[
                            product.pokemonData.typing.typing1,
                            product.pokemonData.typing.typing2,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      </div>
                    )}
                    {product.pokemonData.isShiny && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Variant:
                        </span>
                        <span className="text-xl text-dark">✨ Shiny</span>
                      </div>
                    )}
                    {product.pokemonData.gender && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Gender:
                        </span>
                        <span className="text-xl text-dark">
                          {product.pokemonData.gender}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {product.printedModel?.printColors?.length > 0 && (
            <div className="border border-bg-grey rounded mb-4 overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-4 bg-primary border-none cursor-pointer text-xl font-bold text-light transition-colors hover:bg-primary-lighter"
                onClick={() => toggleSection("print")}
              >
                <span>3D Printing Information</span>
                <FontAwesomeIcon
                  icon={openSections.print ? faChevronUp : faChevronDown}
                />
              </button>
              {openSections.print && (
                <div className="p-4 bg-white">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-dark font-bold opacity-70">
                      Filaments:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.printedModel.printColors.map(
                        (printColor, index) => {
                          const filament = filaments.find(
                            (f) => f.id === printColor.filamentId,
                          );
                          if (!filament) return null;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-bg-light px-2 py-1.5 rounded border border-bg-grey"
                            >
                              <div
                                className="w-4 h-4 rounded border-2 border-gray-300 shrink-0"
                                style={{ backgroundColor: filament.hexColor }}
                                title={filament.hexColor}
                              />
                              <span
                                className="text-sm text-dark"
                                title={`${filament.name} - ${filament.brand}`}
                              >
                                {filament.name}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(product.ballData?.type || product.ballData?.diameter) && (
            <div className="border border-bg-grey rounded mb-4 overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-4 bg-primary border-none cursor-pointer text-xl font-bold text-light transition-colors hover:bg-primary-lighter"
                onClick={() => toggleSection("ball")}
              >
                <span>Ball Information</span>
                <FontAwesomeIcon
                  icon={openSections.ball ? faChevronUp : faChevronDown}
                />
              </button>
              {openSections.ball && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {product.ballData.type && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Ball Type:
                        </span>
                        <span className="text-xl text-dark">
                          {product.ballData.type}
                        </span>
                      </div>
                    )}
                    {product.ballData.diameter && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Diameter:
                        </span>
                        <span className="text-xl text-dark">
                          {product.ballData.diameter}mm
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {(product.filamentData?.type ||
            product.filamentData?.finish ||
            product.filamentData?.diameter ||
            product.filamentData?.printingTemp ||
            product.filamentData?.dryingConditions) && (
            <div className="border border-bg-grey rounded mb-4 overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-4 bg-primary border-none cursor-pointer text-xl font-bold text-light transition-colors hover:bg-primary-lighter"
                onClick={() => toggleSection("filament")}
              >
                <span>Filament Specifications</span>
                <FontAwesomeIcon
                  icon={openSections.filament ? faChevronUp : faChevronDown}
                />
              </button>
              {openSections.filament && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {product.filamentData.type && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Filament Type:
                        </span>
                        <span className="text-xl text-dark">
                          {product.filamentData.type}
                        </span>
                      </div>
                    )}
                    {product.filamentData.finish && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Finish:
                        </span>
                        <span className="text-xl text-dark">
                          {product.filamentData.finish}
                        </span>
                      </div>
                    )}
                    {product.filamentData.diameter && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Diameter:
                        </span>
                        <span className="text-xl text-dark">
                          {product.filamentData.diameter}
                        </span>
                      </div>
                    )}
                    {product.filamentData.printingTemp && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Printing Temp:
                        </span>
                        <span className="text-xl text-dark">
                          {product.filamentData.printingTemp}
                        </span>
                      </div>
                    )}
                    {product.filamentData.dryingConditions && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-dark font-bold opacity-70">
                          Drying Conditions:
                        </span>
                        <span className="text-xl text-dark">
                          {product.filamentData.dryingConditions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

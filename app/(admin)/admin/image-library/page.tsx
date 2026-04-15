"use client";

import { useState } from "react";
import NextImage from "next/image";
import ImageUpload from "@/components/ImageUpload/ImageUpload";
import { useImages } from "@/context/ImagesContext";
import Button from "@/components/Button/Button";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormInput from "@/components/Form/FormInput";
import useDebounce from "@/hooks/useDebounce";
import type { Image } from "@/types/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faImage,
  faChevronDown,
  faChevronUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function ImageLibraryPage() {
  const { images } = useImages();
  const [imagesLoaded, setImagesLoaded] = useState<number>(20);
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filteredImages = images.filter((image: Image) => {
    const normalizedTitle = image.title.replace(/-/g, " ").toLowerCase();
    const titleWords = normalizedTitle.split(" ").filter(Boolean);
    const queryWords = (debouncedQuery || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    return queryWords.every((qWord) =>
      titleWords.some((tWord) => tWord.includes(qWord)),
    );
  });

  const displayedImages = debouncedQuery
    ? filteredImages
    : filteredImages.slice(0, imagesLoaded);

  const handleLoadMore = () => {
    setImagesLoaded((prev) => prev + 10);
  };

  return (
    <div className="w-full min-h-screen bg-bg-light">
      {/* Page header */}
      <div className="w-full bg-primary">
        <ResponsiveWidthWrapper>
          <div className="flex items-center justify-between py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-light tracking-tight">
                Image Library
              </h1>
              <p className="text-light/50 text-sm mt-0.5">
                {images.length} image{images.length !== 1 ? "s" : ""} stored
              </p>
            </div>
            <button
              onClick={() => setUploadOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-light/10 hover:bg-light/20 text-light rounded-lg border border-light/20 transition-colors text-sm font-medium shrink-0"
            >
              <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
              Upload Images
              <FontAwesomeIcon
                icon={uploadOpen ? faChevronUp : faChevronDown}
                className="w-3 h-3"
              />
            </button>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      {/* Upload panel (collapsible) */}
      {uploadOpen && (
        <div className="w-full bg-primary/5 border-b border-bg-grey">
          <ResponsiveWidthWrapper>
            <div className="py-6">
              <ImageUpload />
            </div>
          </ResponsiveWidthWrapper>
        </div>
      )}

      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-6 py-8">
          {/* Search bar */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4 pointer-events-none"
            />
            <FormInput
              type="text"
              id="imageSearch"
              name="imageSearch"
              className="pl-10 pr-28 bg-white"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              placeholder="Search images by name..."
              title="Search for images"
            />
            {debouncedQuery ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs text-dark/40 font-medium">
                  {filteredImages.length} result
                  {filteredImages.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setQuery("")}
                  className="text-dark/30 hover:text-dark/60 transition-colors"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Image grid */}
          {displayedImages.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {displayedImages.map((image: Image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-bg-grey border border-bg-grey hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <NextImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/image-not-found.png";
                    }}
                  />
                  {/* Title overlay on hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2.5 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                      {image.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-bg-grey flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="w-5 h-5 text-dark/25"
                />
              </div>
              <p className="text-dark/50 font-medium">
                No images found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-primary text-sm underline underline-offset-2 hover:text-primary-lighter transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Load more */}
          {!debouncedQuery && imagesLoaded < images.length && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-dark/40 text-sm">
                Showing {displayedImages.length} of {images.length}
              </p>
              <Button onClick={handleLoadMore} className="max-w-xs">
                Load More
              </Button>
            </div>
          )}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

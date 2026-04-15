"use client";

import { useState } from "react";
import NextImage from "next/image";
import ImageUpload from "@/components/ImageUpload/ImageUpload";
import { useImages } from "@/context/ImagesContext";
import Button from "@/components/Button/Button";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import useDebounce from "@/hooks/useDebounce";
import type { Image } from "@/types/image";

export default function ImageLibraryPage() {
  const { images } = useImages();
  const [imagesLoaded, setImagesLoaded] = useState<number>(20);
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);

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
    <div className="w-full flex flex-col items-center gap-4 bg-bg-light py-6 min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-4 mt-8">
          <ImageUpload />

          <FormGroup>
            <FormLabel htmlFor="imageSearch" className="text-2xl font-bold">
              Search Images:
            </FormLabel>
            <FormInput
              type="text"
              id="imageSearch"
              name="imageSearch"
              className="bg-bg-light"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              placeholder="Can search for image name"
              title="Search for images"
            />
          </FormGroup>

          <h2 className="text-3xl font-bold mt-4">Images:</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 w-full">
            {displayedImages?.map((image: Image) => (
              <div
                className="flex flex-col gap-1 bg-white p-4 rounded-xl border border-bg-grey shadow-sm transition-all cursor-pointer hover:scale-110 hover:shadow-[0_0_8px_1px] hover:shadow-primary/50"
                key={image.id}
              >
                <NextImage
                  src={image.url}
                  alt={image.alt}
                  width={400}
                  height={400}
                  className="w-full h-auto object-cover rounded-xl transition-all"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/image-not-found.png";
                  }}
                />
                <p className="text-sm text-dark font-medium wrap-break-word leading-tight">
                  {image.title}
                </p>
              </div>
            ))}
          </div>
          {imagesLoaded < images.length && (
            <Button onClick={handleLoadMore}>Load More</Button>
          )}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

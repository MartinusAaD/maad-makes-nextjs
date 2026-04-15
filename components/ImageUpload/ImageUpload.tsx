"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import { useImagesManager } from "@/hooks/useImagesManager";
import FormFieldset from "@/components/Form/FormFieldset";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import Alert from "@/components/Alert/Alert";

const ImageUpload = () => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [alert, setAlert] = useState<{
    alertMessage: string;
    type: "success" | "error";
  } | null>(null);

  const { addImages, loading, error, uploadProgress } = useImagesManager();

  const fileInputRef = useRef<HTMLInputElement>(null); // Used to clear the input file field on upload.

  useEffect(() => {
    if (!feedbackMessage) return;

    const timer = setTimeout(() => {
      setFeedbackMessage("");
    }, 7000);

    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const images = [...(e.target.files ?? [])];
    setSelectedImages(images);

    // Revoke old preview URLs to prevent memory leaks
    previews.forEach((url) => URL.revokeObjectURL(url));

    // Temporary preview URLs
    const previewUrls = images.map((image) => URL.createObjectURL(image));
    setPreviews(previewUrls);
  };

  // Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      setFeedbackMessage("There are no files selected!");
      return;
    }

    try {
      // Use the hook to upload all selected images
      const uploaded = await addImages(selectedImages);
      console.log("Uploaded images:", uploaded);

      // Revoke all preview URLs before clearing
      previews.forEach((url) => URL.revokeObjectURL(url));

      setSelectedImages([]);
      setPreviews([]);
      setAlert({
        alertMessage: "Images have been successfully uploaded!",
        type: "success",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setAlert({
        alertMessage: "There was an error uploading the images!",
        type: "error",
      });
    }
  };

  return (
    <>
      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={4000}
          onClose={() => setAlert(null)}
        />
      )}
      <form className="w-full" onSubmit={handleSubmit}>
        <FormFieldset legend="Upload Images">
          <FormGroup>
            <FormLabel htmlFor="imageUpload">Select all Images:</FormLabel>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                id="imageUpload"
                name="imageUpload"
                multiple
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
              />
              <label
                htmlFor="imageUpload"
                className="w-full text-center text-base px-4 py-1 rounded border-2 border-primary/50 text-light font-bold bg-primary hover:bg-primary-lighter cursor-pointer transition-colors"
              >
                Select your files
              </label>
            </div>
          </FormGroup>

          {/* Temporary Previews */}
          <div className="w-full flex flex-wrap gap-4 p-4 bg-white rounded border border-bg-grey">
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="preview"
                className="max-w-[200px] max-h-[300px] object-contain rounded border-2 border-bg-grey transition-all hover:scale-105 hover:border-primary"
              />
            ))}
            {previews.length <= 0 && <span>Image Preview</span>}
          </div>

          <p className="min-h-[1rem] text-base font-bold text-primary text-center p-2 rounded">
            {feedbackMessage}
          </p>

          {loading && uploadProgress.total > 0 && (
            <div className="text-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="text-lg font-bold text-primary m-0">
                Uploading {uploadProgress.current} / {uploadProgress.total}{" "}
                images...
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={selectedImages.length === 0 || loading}
            className={
              selectedImages.length === 0 || loading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
          >
            {loading ? "Uploading..." : "Upload Images"}{" "}
            {selectedImages.length > 0 &&
              !loading &&
              `(${selectedImages.length})`}
          </Button>
        </FormFieldset>
      </form>
    </>
  );
};

export default ImageUpload;

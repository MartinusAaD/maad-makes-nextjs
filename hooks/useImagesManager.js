import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";

export const useImagesManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  const addImages = async (files) => {
    if (!files || files.length === 0) return [];

    setLoading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });

    const uploadedImages = [];
    const errors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "upload_preset",
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          );

          const res = await fetch(
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_URL,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}: ${res.statusText}`);
          }

          const data = await res.json();

          const url = data.secure_url;
          const title = file.name;
          const alt = file.name;

          const docRef = await addDoc(collection(database, "images"), {
            title,
            alt,
            url,
            createdAt: serverTimestamp(),
          });

          uploadedImages.push({ id: docRef.id, title, alt, url });
          setUploadProgress({ current: i + 1, total: files.length });
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          errors.push({ file: file.name, error: fileError });
          setUploadProgress({ current: i + 1, total: files.length });
        }
      }

      if (errors.length > 0) {
        console.warn(`${errors.length} file(s) failed to upload:`, errors);
      }
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }

    if (uploadedImages.length === 0 && errors.length > 0) {
      throw new Error("All uploads failed");
    }

    return uploadedImages;
  };

  const editImage = async (imageId, data) => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(database, "images", imageId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, uploadProgress, addImages, editImage };
};

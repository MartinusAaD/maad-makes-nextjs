"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { database } from "@/lib/firestoreConfig";
import type { Image } from "@/types/image";

interface ImagesContextValue {
  images: Image[];
  loading: boolean;
}

const ImagesContext = createContext<ImagesContextValue | null>(null);

export const useImages = () => {
  const context = useContext(ImagesContext);
  if (!context)
    throw new Error("useImages must be used within an ImagesProvider");
  return context;
};

export const ImagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(database, "images"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Image[];
        setImages(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching images:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <ImagesContext.Provider value={{ images, loading }}>
      {children}
    </ImagesContext.Provider>
  );
};

export default ImagesContext;

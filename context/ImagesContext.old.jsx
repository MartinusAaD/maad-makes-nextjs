"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { database } from "@/lib/firestoreConfig";

const ImagesContext = createContext();

export const useImages = () => useContext(ImagesContext);

export const ImagesProvider = ({ children }) => {
  const [images, setImages] = useState([]);
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
        }));
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

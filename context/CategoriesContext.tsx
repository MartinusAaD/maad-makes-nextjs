"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { database } from "@/lib/firestoreConfig";
import type { Category } from "@/types/category";

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context)
    throw new Error("useCategories must be used within a CategoriesProvider");
  return context;
};

export const CategoriesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(database, "categories"), orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading }}>
      {children}
    </CategoriesContext.Provider>
  );
};

"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { database } from "@/lib/firestoreConfig";
import type { Filament } from "@/types/filament";

interface FilamentsContextValue {
  filaments: Filament[];
  loading: boolean;
}

const FilamentsContext = createContext<FilamentsContextValue | null>(null);

export const useFilaments = () => {
  const context = useContext(FilamentsContext);
  if (!context)
    throw new Error("useFilaments must be used within a FilamentsProvider");
  return context;
};

export const FilamentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(database, "filaments"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Filament[];
        setFilaments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching filaments:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <FilamentsContext.Provider value={{ filaments, loading }}>
      {children}
    </FilamentsContext.Provider>
  );
};

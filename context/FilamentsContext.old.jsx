"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { database } from "@/lib/firestoreConfig";

const FilamentsContext = createContext();

export const useFilaments = () => useContext(FilamentsContext);

export const FilamentsProvider = ({ children }) => {
  const [filaments, setFilaments] = useState([]);
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
        }));
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

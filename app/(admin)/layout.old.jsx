"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser === null || !isAdmin) {
      router.replace("/");
    }
  }, [currentUser, isAdmin, router]);

  if (!currentUser || !isAdmin) return null;

  return <>{children}</>;
}

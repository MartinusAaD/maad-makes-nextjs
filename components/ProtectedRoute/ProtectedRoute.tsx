"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — client component that guards a subtree.
 * For App Router projects, prefer using route-group layouts
 * (app/(protected)/layout.jsx and app/(admin)/layout.jsx) instead,
 * as those guard entire route segments without needing this wrapper.
 * This component is kept for legacy / fine-grained use.
 */

interface ProtectedRouteProps {
  children?: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/");
    }
  }, [currentUser, isAdmin, loading, adminOnly, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;
  if (adminOnly && !isAdmin) return null;

  return children;
};

export default ProtectedRoute;

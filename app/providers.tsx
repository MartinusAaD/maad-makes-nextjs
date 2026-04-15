"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ImagesProvider } from "@/context/ImagesContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { FilamentsProvider } from "@/context/FilamentsContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { CartProvider } from "@/context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ImagesProvider>
        <ProductsProvider>
          <CategoriesProvider>
            <FilamentsProvider>
              <OrdersProvider>
                <CartProvider>{children}</CartProvider>
              </OrdersProvider>
            </FilamentsProvider>
          </CategoriesProvider>
        </ProductsProvider>
      </ImagesProvider>
    </AuthProvider>
  );
}

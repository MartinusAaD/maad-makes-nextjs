import { useMemo } from "react";
import useDebounce from "./useDebounce";
import type { Product } from "@/types/product";

export default function useVariantSearch(
  items: Product[],
  query: string,
  limit = 10,
): Product[] {
  const debounced = useDebounce(query || "", 180);

  return useMemo(() => {
    if (!debounced) return items.slice(0, limit);

    const queryWords = debounced.toLowerCase().split(/\s+/).filter(Boolean);

    return items
      .filter((item) => {
        const normalizedTitle = (item.title || "")
          .replace(/-/g, " ")
          .toLowerCase();
        const titleWords = normalizedTitle.split(/\s+/).filter(Boolean);
        return queryWords.every((q) => titleWords.some((t) => t.includes(q)));
      })
      .slice(0, limit);
  }, [items, debounced, limit]);
}

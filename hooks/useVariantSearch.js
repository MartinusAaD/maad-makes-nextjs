import { useMemo } from "react";
import useDebounce from "./useDebounce";

// items: array of products { id, title, thumbnailId, ... }
export default function useVariantSearch(items, query, limit = 10) {
  const debounced = useDebounce(query || "", 180);

  return useMemo(() => {
    if (!debounced) return items.slice(0, limit);

    const queryWords = debounced.toLowerCase().split(/\s+/).filter(Boolean);

    return items
      .filter((item) => {
        const normalizedTitle = item.title.replace(/-/g, " ").toLowerCase();
        const titleWords = normalizedTitle.split(/\s+/).filter(Boolean);
        return queryWords.every((q) => titleWords.some((t) => t.includes(q)));
      })
      .slice(0, limit);
  }, [items, debounced, limit]);
}

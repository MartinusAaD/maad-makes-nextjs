import { useMemo } from "react";
import useDebounce from "./useDebounce";
import type { Image } from "@/types/image";

export default function useImageSearch(
  items: Image[],
  query: string,
  limit = 10,
): Image[] {
  const debounced = useDebounce(query || "", 180);

  return useMemo(() => {
    if (!debounced) return items.slice(0, limit);

    const queryWords = debounced.toLowerCase().split(/\s+/).filter(Boolean);

    return items
      .filter((image) => {
        const normalizedTitle = image.title.replace(/-/g, " ").toLowerCase();
        const titleWords = normalizedTitle.split(/\s+/).filter(Boolean);
        return queryWords.every((q) => titleWords.some((t) => t.includes(q)));
      })
      .slice(0, limit);
  }, [items, debounced, limit]);
}

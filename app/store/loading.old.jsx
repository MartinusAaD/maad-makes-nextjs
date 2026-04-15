import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";

export default function StoreLoading() {
  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        {/* Header skeleton */}
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Filter bar skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-2 flex flex-col gap-2 animate-pulse"
            >
              <div className="w-full aspect-square bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

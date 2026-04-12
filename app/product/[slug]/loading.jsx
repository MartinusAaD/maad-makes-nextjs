import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";

export default function ProductLoading() {
  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 mb-8 bg-white p-4 md:p-8 rounded shadow-md animate-pulse">
          {/* Image column */}
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-square rounded bg-gray-200" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-20 h-20 rounded bg-gray-200" />
              ))}
            </div>
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="h-12 bg-gray-200 rounded w-40 mt-4" />
            <div className="flex gap-3 mt-2">
              <div className="h-11 bg-gray-200 rounded w-32" />
              <div className="h-11 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

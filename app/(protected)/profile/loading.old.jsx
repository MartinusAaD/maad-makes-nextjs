import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";

export default function ProfileLoading() {
  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="bg-white p-8 rounded shadow-md animate-pulse">
          {/* Title */}
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />

          {/* Profile info block */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="h-5 bg-gray-200 rounded w-64" />
            <div className="h-5 bg-gray-200 rounded w-48" />
          </div>

          {/* Orders heading */}
          <div className="h-6 bg-gray-200 rounded w-36 mb-4" />

          {/* Order cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-4 mb-4 flex gap-4"
            >
              <div className="flex gap-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="w-12 h-12 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

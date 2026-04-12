import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";

export default function PortfolioPage() {
  return (
    <div className="py-8 bg-bg-light min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="bg-white p-8 md:p-12 rounded shadow-md text-center">
          <h1 className="text-3xl md:text-4xl text-primary font-bold mb-4">
            Portfolio
          </h1>
          <div className="py-12">
            <p className="text-xl md:text-2xl text-gray-600 mb-2">
              Portfolio section coming soon!
            </p>
            <p className="text-lg text-gray-500 mb-6">
              Check back later to see examples of my work
            </p>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-base text-gray-700">
                In the meantime, feel free to browse the{", "}
                <a
                  href="/store"
                  className="text-primary underline hover:opacity-80"
                >
                  store
                </a>
                !
              </p>
            </div>
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}

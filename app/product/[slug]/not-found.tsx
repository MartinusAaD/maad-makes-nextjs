import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold text-dark">Product Not Found</h2>
      <p className="text-gray-500 max-w-md">
        This product doesn&apos;t exist or is no longer available.
      </p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/store"
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-lighter transition-colors"
        >
          Browse Store
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

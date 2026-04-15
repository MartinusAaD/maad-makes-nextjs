import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold text-dark">Page Not Found</h2>
      <p className="text-gray-500 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-lighter transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}

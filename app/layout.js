import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar/Navbar";
import NavbarAdmin from "@/components/NavbarAdmin/NavbarAdmin";
import Footer from "@/components/Footer/Footer";

export const metadata = {
  title: "MAaD Makes | Custom 3D Printed Products & Located in Norway",
  description:
    "MAaD Makes offers unique 3D printed products. Custom designs, collectible figures, and customizable solutions. Norwegian online store with fast delivery.",
  keywords:
    "3D printing Norway, 3D printed objects, collectible figures, gaming collectibles, custom 3D printing, Norwegian online store, 3D printing Norge",
  authors: [{ name: "MAaD Makes" }],
  robots: "index, follow",
  other: {
    language: "English",
    "geo.region": "NO",
    "geo.placename": "Norway",
    "google-site-verification": "bFDq1f70J5mWSoTQYkJinskh7a3ORt07yQdUVBU260w",
  },
  alternates: {
    canonical: "https://www.maadmakes.no/",
  },
  openGraph: {
    type: "website",
    url: "https://www.maadmakes.no/",
    title: "MAaD Makes - 3D Printing Products in Norway",
    description:
      "MAaD Makes offers unique 3D printed products. Custom designs, collectible figures, and bespoke solutions.",
    images: [
      {
        url: "https://maadmakes.no/icons/android-chrome-512x512.png",
      },
    ],
    locale: "no_NO",
    siteName: "MAaD Makes",
  },
  twitter: {
    card: "summary_large_image",
    site: "https://www.maadmakes.no/",
    title: "MAaD Makes - 3D Printing in Norway",
    description:
      "MAaD Makes offers unique 3D printed products. Custom designs, collectible figures, and bespoke solutions.",
    images: ["https://maadmakes.no/icons/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "MAaD Makes",
  description: "3D printed products in Norway",
  url: "https://maadmakes.no",
  logo: "https://maadmakes.no/icons/android-chrome-512x512.png",
  address: {
    "@type": "PostalAddress",
    addressCountry: "NO",
  },
  geo: {
    "@type": "GeoCoordinates",
    addressCountry: "NO",
  },
  areaServed: "NO",
  inLanguage: "en",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <header>
            <Navbar />
            <NavbarAdmin />
          </header>
          <main className="min-h-screen">{children}</main>
          <footer>
            <Footer />
          </footer>
        </Providers>
      </body>
    </html>
  );
}

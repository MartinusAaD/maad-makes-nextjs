import ProductPageContent from "./ProductPageContent";

async function getProductBySlug(slug) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "products" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug },
              },
            },
            limit: 1,
          },
        }),
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data[0]?.document;
    if (!doc) return null;
    const f = doc.fields;
    return {
      title: f.title?.stringValue ?? null,
      description: f.descriptionMarkdown?.stringValue ?? null,
      slug: f.slug?.stringValue ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product?.title) {
    return { title: "Product Not Found | MAaD Makes" };
  }
  const description = product.description
    ? product.description.replace(/[#*`[\]]/g, "").slice(0, 160)
    : `Shop ${product.title} at MAaD Makes - Custom 3D printed products from Norway.`;
  return {
    title: `${product.title} | MAaD Makes`,
    description,
    alternates: {
      canonical: `https://www.maadmakes.no/product/${slug}`,
    },
    openGraph: {
      title: `${product.title} | MAaD Makes`,
      description,
      type: "website",
      url: `https://www.maadmakes.no/product/${slug}`,
      siteName: "MAaD Makes",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | MAaD Makes`,
      description,
    },
  };
}

export default function ProductPage() {
  return <ProductPageContent />;
}

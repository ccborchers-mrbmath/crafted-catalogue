import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { EnquiryForm } from "@/components/EnquiryForm";
import { formatZAR } from "@/lib/money";
import { getPublicImageUrl } from "@/lib/image-url";
import { getSiteOrigin } from "@/lib/site-origin";
import { ChevronLeft } from "lucide-react";

type ProductDetailRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  wood_type: string | null;
  dimensions: string | null;
  lead_time_days: number | null;
  variants: {
    id: string;
    name: string;
    price_cents: number;
    is_active: boolean;
  }[];
  images: { storage_path: string; alt_text: string | null; sort_order: number }[];
};

const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["products", "detail", slug],
    queryFn: async (): Promise<ProductDetailRow> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, wood_type, dimensions, lead_time_days, variants:product_variants(id, name, price_cents, is_active), images:product_images(storage_path, alt_text, sort_order)",
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return {
        ...data,
        variants: data.variants ?? [],
        images: data.images ?? [],
      } as ProductDetailRow;
    },
  });

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(
      productBySlugQueryOptions(params.slug),
    );
    const origin = await getSiteOrigin();
    return { product, origin };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { product, origin } = loaderData;
    const title = `${product.name} — Nailed It Woodworks`;
    const description = product.description
      ? truncate(product.description, 160)
      : `Handmade ${product.name.toLowerCase()} by Nailed It Woodworks.`;
    const primaryImage = product.images.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
    const imageUrl = primaryImage ? getPublicImageUrl(primaryImage.storage_path) : "";
    const pageUrl = origin ? `${origin}/products/${product.slug}` : undefined;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        ...(pageUrl ? [{ property: "og:url", content: pageUrl }] : []),
        ...(imageUrl ? [{ property: "og:image", content: imageUrl }] : []),
      ],
    };
  },
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const [enquireOpen, setEnquireOpen] = useState(false);

  const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug));

  const activeVariants = product.variants.filter((v) => v.is_active);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0];
  const images = product.images.slice().sort((a, b) => a.sort_order - b.sort_order);
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <Link
            to="/products"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3" /> Back to catalogue
          </Link>
        </div>

        <section className="mx-auto max-w-6xl px-6 py-8 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/5] overflow-hidden bg-muted rounded-md">
              <ProductImage
                path={images[activeImage]?.storage_path ?? null}
                alt={images[activeImage]?.alt_text ?? product.name}
                className="h-full w-full"
                loading="eager"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.storage_path}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`w-20 aspect-[4/5] overflow-hidden rounded-md border transition ${
                      i === activeImage ? "border-primary" : "border-border"
                    }`}
                  >
                    <ProductImage
                      path={img.storage_path}
                      alt=""
                      className="h-full w-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl md:text-5xl">{product.name}</h1>
            {selectedVariant && (
              <div className="mt-3 text-2xl text-primary">
                {formatZAR(selectedVariant.price_cents)}
              </div>
            )}
            {product.description && (
              <p className="mt-6 text-foreground/85 leading-relaxed">
                {product.description}
              </p>
            )}
            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
              {product.wood_type && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Wood
                  </dt>
                  <dd className="mt-1">{product.wood_type}</dd>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Dimensions
                  </dt>
                  <dd className="mt-1">{product.dimensions}</dd>
                </div>
              )}
              {product.lead_time_days != null && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Lead time
                  </dt>
                  <dd className="mt-1">~{product.lead_time_days} days</dd>
                </div>
              )}
              {activeVariants.length > 1 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Options
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {activeVariants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`text-sm rounded-md border px-3 py-1.5 transition ${
                          (selectedVariant?.id === v.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-foreground/40"
                        }`}
                      >
                        {v.name} — {formatZAR(v.price_cents)}
                      </button>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              {!enquireOpen ? (
                <Button size="lg" onClick={() => setEnquireOpen(true)}>
                  Enquire about this piece
                </Button>
              ) : (
                <div className="border border-border rounded-md p-5 bg-card">
                  <h2 className="font-display text-2xl mb-4">Send an enquiry</h2>
                  <EnquiryForm
                    productVariantId={selectedVariant?.id ?? null}
                    productName={
                      product.name +
                      (selectedVariant ? ` — ${selectedVariant.name}` : "")
                    }
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

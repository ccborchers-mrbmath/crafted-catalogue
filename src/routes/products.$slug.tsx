import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { EnquiryForm } from "@/components/EnquiryForm";
import { formatZAR } from "@/lib/money";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${prettifySlug(params.slug)} — Nailed It` },
      {
        name: "description",
        content: `Handmade ${prettifySlug(params.slug).toLowerCase()} by Nailed It Woodworks.`,
      },
    ],
  }),
});

function prettifySlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function ProductDetail() {
  const { slug } = Route.useParams();
  const [enquireOpen, setEnquireOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductDetailRow | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, wood_type, dimensions, lead_time_days, variants:product_variants(id, name, price_cents, is_active), images:product_images(storage_path, alt_text, sort_order)",
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as ProductDetailRow | null;
    },
  });

  const product = data;
  const activeVariants = product?.variants.filter((v) => v.is_active) ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0];
  const images = (product?.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-6xl px-6 py-16 text-muted-foreground">
          Loading…
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-6xl px-6 py-16">
          <h1 className="font-display text-3xl">Product not found</h1>
          <p className="mt-3 text-muted-foreground">
            This piece isn't available.
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">Back to catalogue</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

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

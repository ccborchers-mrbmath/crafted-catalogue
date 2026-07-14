import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { formatZAR } from "@/lib/money";
import heroImg from "@/assets/hero-workshop.jpg";
import { ArrowRight } from "lucide-react";

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  wood_type: string | null;
  variants: { price_cents: number }[];
  images: { storage_path: string; alt_text: string | null }[];
};

const featuredProductsQueryOptions = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async (): Promise<FeaturedProduct[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, wood_type, variants:product_variants(price_cents, is_active), images:product_images(storage_path, alt_text, sort_order)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data ?? []).map((p: any) => ({
      ...p,
      variants: (p.variants ?? []).filter((v: any) => v.is_active),
      images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
  },
});

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(featuredProductsQueryOptions);
  },
});

function HomePage() {
  const { data: featured } = useSuspenseQuery(featuredProductsQueryOptions);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img
              src={heroImg}
              alt=""
              className="w-full h-full object-cover"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          </div>
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.25em] text-accent font-medium">
                Handmade in South Africa
              </div>
              <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[1.05]">
                Wooden furniture,
                <br />
                <span className="italic text-primary">made properly.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Solid hardwood dining tables, bookshelves, and everyday
                homeware — cut, joined and finished by hand in our Cape Town
                workshop.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/products">
                    Browse the catalogue <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/about">Meet the workshop</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Latest work
              </div>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">
                Featured pieces
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm text-primary hover:underline hidden md:inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {(featured ?? []).map((p) => {
              const minPrice = p.variants.length
                ? Math.min(...p.variants.map((v) => v.price_cents))
                : null;
              const img = p.images[0];
              return (
                <Link
                  key={p.id}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  className="group"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted rounded-md">
                    <ProductImage
                      path={img?.storage_path ?? null}
                      alt={img?.alt_text ?? p.name}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl">{p.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {minPrice != null ? `from ${formatZAR(minPrice)}` : ""}
                    </span>
                  </div>
                  {p.wood_type && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {p.wood_type}
                    </div>
                  )}
                </Link>
              );
            })}
            {featured && featured.length === 0 && (
              <p className="text-muted-foreground col-span-full">
                No products yet.
              </p>
            )}
          </div>
        </section>

        {/* About teaser */}
        <section className="bg-secondary/40 border-y border-border/60">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Our approach
            </div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              No shortcuts. No flat-packs.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Every piece is built to order, one at a time, from solid South
              African hardwoods. We cut our own joinery, finish everything by
              hand, and stand behind our work.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/about">More about us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

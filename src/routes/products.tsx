import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/ProductImage";
import { formatZAR } from "@/lib/money";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  wood: z.string().optional().catch(undefined),
});

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  wood_type: string | null;
  variants: { price_cents: number; is_active: boolean }[];
  images: { storage_path: string; alt_text: string | null; sort_order: number }[];
};

const productsListQueryOptions = queryOptions({
  queryKey: ["products", "list"],
  queryFn: async (): Promise<ProductRow[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, wood_type, variants:product_variants(price_cents, is_active), images:product_images(storage_path, alt_text, sort_order)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProductRow[];
  },
});

export const Route = createFileRoute("/products")({
  validateSearch: zodValidator(searchSchema),
  component: ProductsPage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsListQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Products — Nailed It Woodworks" },
      {
        name: "description",
        content:
          "Browse handmade wooden furniture and homeware, built to order in South Africa.",
      },
      { property: "og:title", content: "Products — Nailed It Woodworks" },
      {
        property: "og:description",
        content: "Handmade dining tables, bookshelves, bedside tables and more.",
      },
    ],
  }),
});

function ProductsPage() {
  const { q, wood } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: products } = useSuspenseQuery(productsListQueryOptions);

  const woodTypes = Array.from(
    new Set((products ?? []).map((p) => p.wood_type).filter(Boolean) as string[]),
  ).sort();

  const filtered = (products ?? []).filter((p) => {
    if (wood && p.wood_type !== wood) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!p.name.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Catalogue
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">
            All products
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Everything below is built to order in our workshop. Lead times vary
            by piece — get in touch and we'll confirm timing for yours.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px] items-end">
            <div>
              <Label htmlFor="q" className="text-xs uppercase tracking-widest text-muted-foreground">
                Search
              </Label>
              <Input
                id="q"
                placeholder="Search by name…"
                value={q ?? ""}
                onChange={(e) =>
                  navigate({
                    search: (prev: z.infer<typeof searchSchema>) => ({
                      ...prev,
                      q: e.target.value || undefined,
                    }),
                    replace: true,
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Wood
              </Label>
              <Select
                value={wood ?? "all"}
                onValueChange={(v) =>
                  navigate({
                    search: (prev: z.infer<typeof searchSchema>) => ({
                      ...prev,
                      wood: v === "all" ? undefined : v,
                    }),
                    replace: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wood types</SelectItem>
                  {woodTypes.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground py-16 text-center">
              No products match your filters.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {filtered.map((p) => {
                const activeVariants = p.variants.filter((v) => v.is_active);
                const minPrice = activeVariants.length
                  ? Math.min(...activeVariants.map((v) => v.price_cents))
                  : null;
                const img = [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0];
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
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { randsToCents } from "@/lib/money";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProductPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function NewProductPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) {
      setBusy(false);
      return toast.error("Name is required");
    }
    const slug = slugify(String(fd.get("slug") ?? "") || name);
    const priceRands = String(fd.get("price") ?? "");

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description: String(fd.get("description") ?? "") || null,
        wood_type: String(fd.get("wood_type") ?? "") || null,
        dimensions: String(fd.get("dimensions") ?? "") || null,
        lead_time_days: fd.get("lead_time_days")
          ? Number(fd.get("lead_time_days"))
          : null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !product) {
      setBusy(false);
      return toast.error(error?.message ?? "Failed to create product");
    }

    const { error: vErr } = await supabase.from("product_variants").insert({
      product_id: product.id,
      name: String(fd.get("variant_name") ?? "Standard").trim() || "Standard",
      price_cents: randsToCents(priceRands),
      is_active: true,
    });
    setBusy(false);
    if (vErr) return toast.error(vErr.message);
    toast.success("Product created");
    navigate({ to: "/admin/products/$id", params: { id: product.id } });
  }

  return (
    <div>
      <Link
        to="/admin/products"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ChevronLeft className="h-3 w-3" /> Products
      </Link>
      <h1 className="font-display text-3xl mt-2">New product</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Create a product with an initial variant. Add images and more variants
        after saving.
      </p>
      <form onSubmit={submit} className="grid gap-5 mt-8 max-w-xl">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={120} />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL) — optional</Label>
          <Input id="slug" name="slug" maxLength={60} placeholder="auto from name" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="wood_type">Wood type</Label>
            <Input id="wood_type" name="wood_type" />
          </div>
          <div>
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input id="dimensions" name="dimensions" placeholder="e.g. 2400 × 950 × 760 mm" />
          </div>
          <div>
            <Label htmlFor="lead_time_days">Lead time (days)</Label>
            <Input id="lead_time_days" name="lead_time_days" type="number" min={0} />
          </div>
        </div>
        <div className="border-t border-border pt-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Initial variant
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-3">
            <div>
              <Label htmlFor="variant_name">Variant name</Label>
              <Input
                id="variant_name"
                name="variant_name"
                defaultValue="Standard"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </div>
          </div>
        </div>
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

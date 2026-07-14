import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatZAR, randsToCents, centsToRandsString } from "@/lib/money";
import { ProductImage } from "@/components/ProductImage";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/image-url";
import { ChevronLeft, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProductPage,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  wood_type: string | null;
  dimensions: string | null;
  lead_time_days: number | null;
  is_active: boolean;
};
type Variant = {
  id: string;
  name: string;
  price_cents: number;
  sku: string | null;
  is_active: boolean;
};
type Image = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

function EditProductPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const productQ = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Product;
    },
  });
  const variantsQ = useQuery({
    queryKey: ["admin", "variants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Variant[];
    },
  });
  const imagesQ = useQuery({
    queryKey: ["admin", "images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Image[];
    },
  });

  const saveProduct = useMutation({
    mutationFn: async (patch: Partial<Product>) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function onSaveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveProduct.mutate({
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      description: String(fd.get("description") ?? "") || null,
      wood_type: String(fd.get("wood_type") ?? "") || null,
      dimensions: String(fd.get("dimensions") ?? "") || null,
      lead_time_days: fd.get("lead_time_days")
        ? Number(fd.get("lead_time_days"))
        : null,
      is_active: fd.get("is_active") === "on",
    });
  }

  if (productQ.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!productQ.data) return <div>Product not found.</div>;
  const p = productQ.data;

  return (
    <div className="grid gap-10">
      <div>
        <Link
          to="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" /> Products
        </Link>
        <h1 className="font-display text-3xl mt-2">{p.name}</h1>
      </div>

      {/* Details */}
      <section className="border border-border rounded-md p-6 bg-card">
        <h2 className="font-display text-xl">Details</h2>
        <form onSubmit={onSaveProduct} className="grid gap-4 mt-4 max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={p.name} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={p.slug} required />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={p.description ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="wood_type">Wood type</Label>
              <Input id="wood_type" name="wood_type" defaultValue={p.wood_type ?? ""} />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input id="dimensions" name="dimensions" defaultValue={p.dimensions ?? ""} />
            </div>
            <div>
              <Label htmlFor="lead_time_days">Lead time (days)</Label>
              <Input
                id="lead_time_days"
                name="lead_time_days"
                type="number"
                min={0}
                defaultValue={p.lead_time_days ?? ""}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="is_active" name="is_active" defaultChecked={p.is_active} />
            <Label htmlFor="is_active">Active (visible on the site)</Label>
          </div>
          <div>
            <Button type="submit" disabled={saveProduct.isPending}>
              {saveProduct.isPending ? "Saving…" : "Save details"}
            </Button>
          </div>
        </form>
      </section>

      {/* Variants */}
      <VariantsSection productId={id} variants={variantsQ.data ?? []} />

      {/* Images */}
      <ImagesSection productId={id} images={imagesQ.data ?? []} />
    </div>
  );
}

function VariantsSection({ productId, variants }: { productId: string; variants: Variant[] }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "variants", productId] });

  const save = useMutation({
    mutationFn: async (v: Partial<Variant> & { id: string }) => {
      const { id, ...patch } = v;
      const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variant updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (vid: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", vid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variant deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const add = useMutation({
    mutationFn: async (input: { name: string; price_cents: number; sku: string | null }) => {
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        name: input.name,
        price_cents: input.price_cents,
        sku: input.sku,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variant added");
      setAdding(false);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <section className="border border-border rounded-md p-6 bg-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Variants</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add variant
        </Button>
      </div>
      <div className="mt-4 grid gap-3">
        {variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            onSave={(patch) => save.mutate({ id: v.id, ...patch })}
            onDelete={() => {
              if (confirm(`Delete variant "${v.name}"?`)) remove.mutate(v.id);
            }}
          />
        ))}
        {variants.length === 0 && !adding && (
          <div className="text-sm text-muted-foreground">No variants yet.</div>
        )}
        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              add.mutate({
                name: String(fd.get("name") ?? "").trim() || "Standard",
                price_cents: randsToCents(String(fd.get("price") ?? "")),
                sku: String(fd.get("sku") ?? "") || null,
              });
            }}
            className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] items-end border-t border-border pt-3"
          >
            <div>
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Price (ZAR)</Label>
              <Input name="price" type="number" min={0} step="0.01" required />
            </div>
            <div>
              <Label>SKU</Label>
              <Input name="sku" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Add</Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function VariantRow({
  variant,
  onSave,
  onDelete,
}: {
  variant: Variant;
  onSave: (patch: Partial<Variant>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(variant.name);
  const [price, setPrice] = useState(centsToRandsString(variant.price_cents));
  const [sku, setSku] = useState(variant.sku ?? "");
  const dirty =
    name !== variant.name ||
    randsToCents(price) !== variant.price_cents ||
    (sku || null) !== variant.sku;

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto_auto] items-end">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Price (ZAR)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div>
        <Label>SKU</Label>
        <Input value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={variant.is_active}
          onCheckedChange={(v) => onSave({ is_active: v })}
        />
        <span className="text-xs text-muted-foreground">Active</span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() =>
            onSave({
              name,
              price_cents: randsToCents(price),
              sku: sku || null,
            })
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="sm:col-span-5 text-xs text-muted-foreground -mt-2">
        Currently: {formatZAR(variant.price_cents)}
      </div>
    </div>
  );
}

function ImagesSection({ productId, images }: { productId: string; images: Image[] }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "images", productId] });

  async function uploadFile(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const maxOrder = images.reduce((m, i) => Math.max(m, i.sort_order), -1);
    const { error: insErr } = await supabase.from("product_images").insert({
      product_id: productId,
      storage_path: path,
      alt_text: null,
      sort_order: maxOrder + 1,
    });
    setUploading(false);
    if (insErr) return toast.error(insErr.message);
    toast.success("Image uploaded");
    invalidate();
  }

  const removeImg = useMutation({
    mutationFn: async (img: Image) => {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([img.storage_path]);
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const swap = useMutation({
    mutationFn: async ({ a, b }: { a: Image; b: Image }) => {
      const { error: e1 } = await supabase
        .from("product_images")
        .update({ sort_order: b.sort_order })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("product_images")
        .update({ sort_order: a.sort_order })
        .eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  const setAlt = useMutation({
    mutationFn: async ({ id, alt_text }: { id: string; alt_text: string }) => {
      const { error } = await supabase
        .from("product_images")
        .update({ alt_text: alt_text || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <section className="border border-border rounded-md p-6 bg-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Images</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="h-4 w-4 mr-1" />
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((img, idx) => (
          <div key={img.id} className="border border-border rounded-md overflow-hidden">
            <div className="aspect-[4/5] bg-muted">
              <ProductImage path={img.storage_path} alt={img.alt_text ?? ""} className="h-full w-full" />
            </div>
            <div className="p-3 grid gap-2">
              <Input
                placeholder="Alt text"
                defaultValue={img.alt_text ?? ""}
                onBlur={(e) =>
                  e.target.value !== (img.alt_text ?? "") &&
                  setAlt.mutate({ id: img.id, alt_text: e.target.value })
                }
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => swap.mutate({ a: img, b: images[idx - 1] })}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={idx === images.length - 1}
                    onClick={() => swap.mutate({ a: img, b: images[idx + 1] })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Remove this image?")) removeImg.mutate(img);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">
            No images yet.
          </div>
        )}
      </div>
    </section>
  );
}

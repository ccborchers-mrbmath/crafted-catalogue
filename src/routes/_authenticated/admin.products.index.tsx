import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatZAR } from "@/lib/money";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: AdminProductsList,
});

type Row = {
  id: string;
  name: string;
  slug: string;
  wood_type: string | null;
  is_active: boolean;
  variants: { price_cents: number }[];
};

function AdminProductsList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, wood_type, is_active, variants:product_variants(price_cents)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the catalogue — {data?.length ?? 0} total.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="h-4 w-4 mr-1" /> New product
          </Link>
        </Button>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Wood</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => {
                const min = p.variants.length
                  ? Math.min(...p.variants.map((v) => v.price_cents))
                  : null;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/products/$id"
                        params={{ id: p.id }}
                        className="hover:underline font-medium"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">{p.wood_type ?? "—"}</td>
                    <td className="px-4 py-3">
                      {min != null ? formatZAR(min) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) =>
                          toggle.mutate({ id: p.id, is_active: v })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/products/$id" params={{ id: p.id }}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"? This can't be undone.`))
                            remove.mutate(p.id);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {data && data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

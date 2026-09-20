import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatZAR, randsToCents, centsToRandsString } from "@/lib/money";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: AdminInventory,
});

type Asset = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  condition: string | null;
  status: string;
  location: string | null;
  serial_number: string | null;
  supplier: string | null;
  purchase_date: string | null;
  purchase_price_cents: number | null;
  notes: string | null;
};

const CATEGORY_SUGGESTIONS = [
  "Hand tool",
  "Power tool",
  "Machinery",
  "Vehicle",
  "Safety equipment",
  "Furniture & fixtures",
  "IT & electronics",
  "Consumable",
  "Other",
];

const CONDITIONS = ["New", "Good", "Fair", "Poor", "Needs repair"];

const STATUSES: { value: string; label: string }[] = [
  { value: "in_use", label: "In use" },
  { value: "in_storage", label: "In storage" },
  { value: "in_repair", label: "In repair" },
  { value: "retired", label: "Retired" },
  { value: "sold", label: "Sold" },
  { value: "lost", label: "Lost / written off" },
];

function statusLabel(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  switch (value) {
    case "in_use":
      return "default";
    case "in_storage":
      return "secondary";
    case "in_repair":
      return "destructive";
    default:
      return "outline";
  }
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function AdminInventory() {
  const qc = useQueryClient();
  // null = dialog closed; "new" = add form; an Asset = edit that asset.
  const [dialog, setDialog] = useState<Asset | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "assets"],
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          "id, name, category, quantity, condition, status, location, serial_number, supplier, purchase_date, purchase_price_cents, notes",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Asset[];
    },
  });

  const save = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<Asset, "id">;
    }) => {
      if (id) {
        const { error } = await supabase.from("assets").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assets").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: (_r, vars) => {
      toast.success(vars.id ? "Item updated" : "Item added");
      setDialog(null);
      qc.invalidateQueries({ queryKey: ["admin", "assets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["admin", "assets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return toast.error("Name is required");

    const priceStr = String(fd.get("purchase_price") ?? "").trim();
    const qtyStr = String(fd.get("quantity") ?? "").trim();
    const str = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v || null;
    };

    const values: Omit<Asset, "id"> = {
      name,
      category: str("category"),
      quantity: qtyStr ? Math.max(0, Math.floor(Number(qtyStr))) : 1,
      condition: str("condition"),
      status: String(fd.get("status") ?? "in_use") || "in_use",
      location: str("location"),
      serial_number: str("serial_number"),
      supplier: str("supplier"),
      purchase_date: str("purchase_date"),
      purchase_price_cents: priceStr ? randsToCents(priceStr) : null,
      notes: str("notes"),
    };

    const editing = dialog && dialog !== "new" ? dialog : null;
    save.mutate({ id: editing?.id, values });
  }

  const assets = data ?? [];
  const editing = dialog && dialog !== "new" ? dialog : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Inventory &amp; assets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Workshop tools, machinery and business-owned assets — {assets.length}{" "}
            {assets.length === 1 ? "item" : "items"}.
          </p>
        </div>
        <Button onClick={() => setDialog("new")}>
          <Plus className="h-4 w-4 mr-1" /> Add item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Condition</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Purchase</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.category ?? "Uncategorised"}
                      {a.serial_number ? ` · SN ${a.serial_number}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.quantity}</td>
                  <td className="px-4 py-3">{a.condition ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(a.status)}>
                      {statusLabel(a.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{a.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    {a.purchase_price_cents != null
                      ? formatZAR(a.purchase_price_cents)
                      : "—"}
                    {a.purchase_date ? (
                      <div className="text-xs text-muted-foreground">
                        {a.purchase_date}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setDialog(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${a.name}"? This can't be undone.`))
                          remove.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No inventory items yet. Click “Add item” to record your first
                    tool, machine or asset.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              Only the name is required. Fill in as much detail as you want to
              keep for each asset.
            </DialogDescription>
          </DialogHeader>
          {/* key forces the form to reset its defaultValues when switching items */}
          <form
            key={editing?.id ?? "new"}
            onSubmit={onSubmit}
            className="grid gap-4"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={200}
                defaultValue={editing?.name ?? ""}
                placeholder="e.g. Makita plunge saw"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  list="asset-categories"
                  defaultValue={editing?.category ?? ""}
                  placeholder="e.g. Power tool"
                />
                <datalist id="asset-categories">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={editing?.quantity ?? 1}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <select
                  id="condition"
                  name="condition"
                  className={selectClass}
                  defaultValue={editing?.condition ?? ""}
                >
                  <option value="">—</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className={selectClass}
                  defaultValue={editing?.status ?? "in_use"}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editing?.location ?? ""}
                  placeholder="e.g. Main workshop, rack B"
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Serial / model no.</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  defaultValue={editing?.serial_number ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  defaultValue={editing?.supplier ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="purchase_date">Purchase date</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  defaultValue={editing?.purchase_date ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="purchase_price">Purchase price (ZAR)</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={
                    editing?.purchase_price_cents != null
                      ? centsToRandsString(editing.purchase_price_cents)
                      : ""
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editing?.notes ?? ""}
                placeholder="Maintenance history, warranty, accessories…"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  component: EnquiriesPage,
});

type Enquiry = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  delivery_suburb: string | null;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  product_variant_id: string | null;
  variant: { name: string; product: { name: string; slug: string } | null } | null;
};

const STATUSES: EnquiryStatus[] = ["new", "contacted", "quoted", "closed"];

function EnquiriesPage() {
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "enquiries", filter],
    queryFn: async (): Promise<Enquiry[]> => {
      let query = supabase
        .from("enquiries")
        .select(
          "id, customer_name, email, phone, delivery_suburb, message, status, created_at, product_variant_id, variant:product_variants(name, product:products(name, slug))",
        )
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Enquiry[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EnquiryStatus }) => {
      const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Enquiries</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.length ?? 0} shown
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4">
          {(data ?? []).map((e) => (
            <div key={e.id} className="border border-border rounded-md p-5 bg-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{e.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("en-ZA")}
                  </div>
                </div>
                <Select
                  value={e.status}
                  onValueChange={(v) =>
                    updateStatus.mutate({ id: e.id, status: v as EnquiryStatus })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 text-sm grid gap-1 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <a className="hover:underline" href={`mailto:${e.email}`}>{e.email}</a>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <a className="hover:underline" href={`tel:${e.phone}`}>{e.phone}</a>
                </div>
                {e.delivery_suburb && (
                  <div>
                    <span className="text-muted-foreground">Suburb: </span>
                    {e.delivery_suburb}
                  </div>
                )}
                {e.variant?.product && (
                  <div>
                    <span className="text-muted-foreground">Product: </span>
                    {e.variant.product.name} — {e.variant.name}
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm whitespace-pre-wrap border-t border-border pt-3">
                {e.message}
              </div>
            </div>
          ))}
          {data && data.length === 0 && (
            <div className="text-muted-foreground text-center py-16">
              No enquiries {filter !== "all" ? `with status "${filter}"` : ""}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

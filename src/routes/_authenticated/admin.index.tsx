import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [newEnq, products, allEnq] = await Promise.all([
        supabase
          .from("enquiries")
          .select("*", { count: "exact", head: true })
          .eq("status", "new"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("enquiries").select("*", { count: "exact", head: true }),
      ]);
      return {
        newEnquiries: newEnq.count ?? 0,
        activeProducts: products.count ?? 0,
        totalEnquiries: allEnq.count ?? 0,
      };
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Workshop dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Overview of the catalogue and incoming enquiries.
      </p>
      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <Card className="p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            New enquiries
          </div>
          <div className="mt-2 font-display text-4xl">
            {stats?.newEnquiries ?? "—"}
          </div>
          <Link
            to="/admin/enquiries"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View enquiries →
          </Link>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Active products
          </div>
          <div className="mt-2 font-display text-4xl">
            {stats?.activeProducts ?? "—"}
          </div>
          <Link
            to="/admin/products"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Manage products →
          </Link>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Total enquiries
          </div>
          <div className="mt-2 font-display text-4xl">
            {stats?.totalEnquiries ?? "—"}
          </div>
        </Card>
      </div>
    </div>
  );
}

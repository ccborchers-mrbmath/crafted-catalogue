import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-6xl px-6 py-16 text-muted-foreground">
          Checking access…
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-md w-full px-6 py-16 text-center">
          <h1 className="font-display text-3xl">Not authorized</h1>
          <p className="mt-3 text-muted-foreground">
            You're signed in, but your account doesn't have admin access to
            manage the catalogue.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Back to site</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6 text-sm">
          <span className="font-medium text-muted-foreground">Admin</span>
          <Link
            to="/admin"
            className="text-foreground/80 hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
            activeOptions={{ exact: true }}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/products"
            className="text-foreground/80 hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Products
          </Link>
          <Link
            to="/admin/enquiries"
            className="text-foreground/80 hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Enquiries
          </Link>
        </div>
      </div>
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";

export function Header() {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Hammer className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-medium tracking-tight">
            Nailed It
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link
            to="/products"
            className="text-foreground/80 hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Products
          </Link>
          <Link
            to="/about"
            className="text-foreground/80 hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-foreground/80 hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Contact
          </Link>
          {user && isAdmin && (
            <Link
              to="/admin"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link to="/contact">Get in touch</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

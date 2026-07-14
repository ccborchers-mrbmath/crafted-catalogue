import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl">Nailed It</div>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Handmade wooden furniture and homeware, built to last a generation.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Explore
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/products" className="hover:underline">
                All products
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline">
                About the workshop
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Contact
          </div>
          {/* TODO: replace placeholder contact info with real details */}
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hello@nailed-it.co.za</li>
            <li>+27 (0) 21 000 0000</li>
            <li>Cape Town, South Africa</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Nailed It Woodworks</span>
          <span>Made by hand in South Africa</span>
        </div>
      </div>
    </footer>
  );
}

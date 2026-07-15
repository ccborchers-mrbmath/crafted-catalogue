import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Nailed It Woodworks" },
      {
        name: "description",
        content:
          "Nailed It is a small woodworking studio in South Africa building solid hardwood furniture and homeware by hand.",
      },
      { property: "og:title", content: "About Nailed It Woodworks" },
      {
        property: "og:description",
        content:
          "A small South African workshop building solid hardwood furniture by hand.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            About us
          </div>
          <h2 className="text-3xl font-serif font-bold mb-6">
              Crafting timeless pieces, the traditional way.
          </h2>

          <div className="space-y-6 text-gray-800">
          <p>
            What began with a single workbench and vintage chisels has grown into a steadfast dedication to authentic craftsmanship. A decade later, our philosophy remains unchanged: we craft each piece individually, shaped by hand and precision workshop machinery, and finished with natural oil and wax.
          </p>

          <p>
            We build exclusively with solid South African hardwoods — like oak, kiaat, and reclaimed pine — selected for their enduring character rather than shipping convenience. Every joint is engineered for lasting strength, not speed. Every surface is meticulously planed and sanded until it feels perfect to the touch.
          </p>

          <p>
            If you have a custom piece in mind for your space, let's connect. We will discuss your vision, map out dimensions and lead times, select the right timber, and provide a transparent quote before the first board is cut.
          </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3 border-t border-border pt-10">
            <div>
              <div className="font-display text-3xl text-primary">Solid</div>
              <p className="mt-1 text-sm text-muted-foreground">
                No veneer, no MDF. Real timber, cut to length in the workshop.
              </p>
            </div>
            <div>
              <div className="font-display text-3xl text-primary">Slow</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Made to order over weeks, not shipped from a warehouse.
              </p>
            </div>
            <div>
              <div className="font-display text-3xl text-primary">Local</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Built in Cape Town, delivered across South Africa.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

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
          <h1 className="mt-2 font-display text-4xl md:text-5xl">
            A small workshop, doing it the long way.
          </h1>
          <div className="mt-8 space-y-6 text-lg text-foreground/85 leading-relaxed">
            <p>
              Nailed It started with one workbench, a set of second-hand chisels
              and a stubborn refusal to buy flat-pack furniture. Nearly a decade
              later, we still work the same way: one piece at a time, cut and
              joined by hand, finished with oil and wax.
            </p>
            <p>
              We build with solid South African hardwoods — oak, kiaat,
              reclaimed pine — chosen for how they age, not how quickly they
              can be shipped. Every joint is cut for strength, not speed. Every
              surface is planed and sanded until it feels right in the hand.
            </p>
            <p>
              If you'd like something built for your space, get in touch. We'll
              talk through timber, dimensions and lead time, and give you an
              honest quote before any wood is cut.
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

import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Nailed It Woodworks" },
      {
        name: "description",
        content:
          "Get in touch with Nailed It Woodworks about a commission, order or delivery in South Africa.",
      },
      { property: "og:title", content: "Contact Nailed It Woodworks" },
      {
        property: "og:description",
        content: "Enquire about a piece or a custom commission.",
      },
    ],
  }),
});

function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Contact
            </div>
            <h1 className="mt-2 font-display text-4xl">
              Tell us about your piece.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Send us a note about a product, a commission or a delivery
              question and we'll get back to you within a working day.
            </p>
            {/* TODO: replace placeholder contact info with real details */}
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@nailed-it.co.za</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span>+27 (0) 21 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Workshop in Cape Town — visits by appointment</span>
              </li>
            </ul>
          </div>
          <div className="border border-border rounded-md p-6 bg-card">
            <EnquiryForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

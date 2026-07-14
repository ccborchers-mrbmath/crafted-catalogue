import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const schema = z.object({
  customer_name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a phone number").max(20),
  delivery_suburb: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Please add a short message").max(2000),
});

interface Props {
  productVariantId?: string | null;
  productName?: string;
  compact?: boolean;
}

export function EnquiryForm({ productVariantId, productName, compact }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      customer_name: String(form.get("customer_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      delivery_suburb: String(form.get("delivery_suburb") ?? "") || undefined,
      message: String(form.get("message") ?? ""),
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from("enquiries").insert({
      customer_name: parsed.data.customer_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      delivery_suburb: parsed.data.delivery_suburb ?? null,
      message: parsed.data.message,
      product_variant_id: productVariantId ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send your enquiry. Please try again.");
      return;
    }
    toast.success("Enquiry sent — we'll be in touch shortly.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {productName && (
        <div className="text-sm text-muted-foreground border border-border rounded-md px-3 py-2 bg-secondary/40">
          Enquiring about: <span className="text-foreground font-medium">{productName}</span>
        </div>
      )}
      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <Label htmlFor="customer_name">Name</Label>
          <Input id="customer_name" name="customer_name" required maxLength={100} />
          {errors.customer_name && <p className="text-xs text-destructive mt-1">{errors.customer_name}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required maxLength={255} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required maxLength={20} />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="delivery_suburb">Delivery suburb (optional)</Label>
          <Input id="delivery_suburb" name="delivery_suburb" maxLength={100} placeholder="e.g. Sea Point" />
        </div>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required rows={5} maxLength={2000} />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
      </div>
      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </Button>
      </div>
    </form>
  );
}

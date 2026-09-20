-- Workshop inventory / business asset register.
--
-- Distinct from sellable stock (products/product_variants): this table records
-- tools, machinery and other assets owned by the business — what it is, how
-- many, condition, where it lives, and purchase/ownership details. It is
-- internal-only: unlike products, there is NO anon/public access. Only signed-in
-- admins can read or write, enforced by RLS via public.has_role().

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'in_use',
  location TEXT,
  serial_number TEXT,
  supplier TEXT,
  purchase_date DATE,
  purchase_price_cents INTEGER CHECK (purchase_price_cents IS NULL OR purchase_price_cents >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.assets (created_at DESC);
CREATE INDEX ON public.assets (category);

-- No anon grant: business assets are internal, never exposed to the public site.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assets"
  ON public.assets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep updated_at current on every edit. Generic helper so future tables can
-- reuse it; CREATE OR REPLACE makes this migration safe to re-run.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER assets_set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

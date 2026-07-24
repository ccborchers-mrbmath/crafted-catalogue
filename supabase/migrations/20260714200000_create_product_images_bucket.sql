-- Create the product-images storage bucket.
--
-- Earlier migrations add RLS policies for this bucket and (in
-- 20260714170000) set it public, but nothing actually CREATES the bucket. On
-- a fresh Supabase project — e.g. after moving off Lovable Cloud to an
-- independent project and rebuilding the schema — the bucket is absent, so
-- every admin image upload fails with "Bucket not found" and product images
-- never render. This creates it idempotently so the repo reproduces the
-- database from scratch. Public, so getPublicUrl() serves product images
-- directly without signed URLs (the objects are already meant to be publicly
-- readable via the existing storage.objects SELECT policy).
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

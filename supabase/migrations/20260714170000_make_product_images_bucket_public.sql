-- product-images objects are already unconditionally readable by anon/authenticated
-- via the "Public read product images" RLS policy. Mark the bucket public so the
-- storage API serves a stable, non-expiring public URL (getPublicUrl) instead of a
-- short-lived signed URL — needed so link-preview bots (og:image) and SSR'd pages
-- don't hit expired links, and so images don't need a signed-URL round trip to render.
UPDATE storage.buckets SET public = true WHERE id = 'product-images';

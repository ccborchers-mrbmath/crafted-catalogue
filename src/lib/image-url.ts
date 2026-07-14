import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();
const BUCKET = "product-images";
const TTL_SECONDS = 60 * 60; // 1 hour

/** Get a signed URL for a stored product image path. Cached client-side. */
export async function getImageUrl(path: string): Promise<string> {
  if (!path) return "";
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expires > now + 60_000) return cached.url;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TTL_SECONDS);
  if (error || !data) return "";
  cache.set(path, { url: data.signedUrl, expires: now + TTL_SECONDS * 1000 });
  return data.signedUrl;
}

export const PRODUCT_IMAGES_BUCKET = BUCKET;

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";

/**
 * Public URL for a stored product image path. The product-images bucket is
 * publicly readable (see the "Public read product images" RLS policy), so
 * this is a synchronous string build with no network call — safe to call
 * during SSR and cheap enough to call at render time.
 */
export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const PRODUCT_IMAGES_BUCKET = BUCKET;

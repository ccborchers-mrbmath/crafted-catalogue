import { useEffect, useState } from "react";
import { getImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function ProductImage({ path, alt, className, loading = "lazy" }: ProductImageProps) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl("");
      return;
    }
    getImageUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-xs",
          className,
        )}
        aria-label={alt}
      >
        <span className="opacity-50">Loading…</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      className={cn("object-cover", className)}
    />
  );
}

import { cn } from "@/lib/utils";

function publicAssetPath(filename: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base ? `${base}/${filename}` : `/${filename}`;
}

/** Public `public/logo.png` — works with any Vite `base` path. */
export function appLogoUrl(): string {
  return publicAssetPath("logo.png");
}

/** Public `public/ravyu_favicon.svg` — tab icon + in-app mark. */
export function appFaviconSvgUrl(): string {
  return publicAssetPath("ravyu_favicon.svg");
}

/** Point `<link rel="icon">` at the SVG using the correct base path (SPA / subdirectory deploys). */
export function syncDocumentFaviconWithBase(): void {
  const href = appFaviconSvgUrl();
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
  if (!link) {
    link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  }
  if (link) {
    link.type = "image/svg+xml";
    link.href = href;
  } else {
    const el = document.createElement("link");
    el.rel = "icon";
    el.type = "image/svg+xml";
    el.href = href;
    document.head.appendChild(el);
  }
}

export function AppBrandLogo({ className, alt = "Ravyu" }: { className?: string; alt?: string }) {
  return <img src={appLogoUrl()} alt={alt} className={cn("object-contain", className)} loading="eager" decoding="async" />;
}

export function AppFaviconMark({ className, alt = "Ravyu" }: { className?: string; alt?: string }) {
  return <img src={appFaviconSvgUrl()} alt={alt} className={cn("object-contain", className)} loading="eager" decoding="async" />;
}

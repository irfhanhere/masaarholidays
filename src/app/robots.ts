import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/quote/", "/doc-render/", "/esim/checkout/"],
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { POSTS } from "@/content/bugs";
import { PROJECTS } from "@/content/site";
import { SITE_URL } from "@/lib/site-url";

/** Cada página existe em pt e en; o sitemap declara os pares para os buscadores. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...PROJECTS.map((p) => `/${p.id}`), "/bugs", ...POSTS.map((p) => `/bugs/${p.slug}`)];
  return paths.flatMap((path) =>
    (["pt", "en"] as const).map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      changeFrequency: path.startsWith("/bugs") ? ("monthly" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path === "/bugs" ? 0.8 : 0.6,
      alternates: { languages: { "pt-BR": `${SITE_URL}/pt${path}`, en: `${SITE_URL}/en${path}` } },
    })),
  );
}

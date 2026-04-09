"use client";

import { useEffect } from "react";
import { getPageSeo, SeoSettings } from "@/lib/seoStore";

/**
 * Applies SEO meta tags (title, description, keywords, OG, canonical) to the
 * document head based on per-page settings saved by the admin in localStorage.
 *
 * @param pageKey  The page identifier (e.g. "home", "about", "blog").
 * @param overrides  Optional overrides applied on top of stored settings.
 */
export function useSeoMeta(pageKey: string, overrides?: Partial<SeoSettings>) {
  useEffect(() => {
    const seo: SeoSettings = { ...getPageSeo(pageKey), ...overrides };

    // Title
    if (seo.title) document.title = seo.title;

    // Standard meta tags
    setMeta("description", seo.description);
    if (seo.keywords) setMeta("keywords", seo.keywords);
    setMeta("robots", seo.robots || "index, follow");

    // Canonical URL
    if (seo.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = seo.canonicalUrl;
    }

    // Open Graph
    setMetaProp("og:title", seo.ogTitle || seo.title);
    setMetaProp("og:description", seo.ogDescription || seo.description);
    setMetaProp("og:type", "website");
    if (seo.ogImage) setMetaProp("og:image", seo.ogImage);
    else if (seo.featureImage) setMetaProp("og:image", seo.featureImage);
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── helpers ─────────────────────────────────────────────────────────────────

function setMeta(name: string, content: string) {
  if (!content) return;
  let el = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProp(property: string, content: string) {
  if (!content) return;
  let el = document.querySelector(
    `meta[property="${property}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

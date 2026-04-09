// SEO settings are persisted in localStorage so the admin can manage them
// without requiring backend API changes.

const SEO_KEY = "brightocity_seo_settings";
const BLOG_SEO_KEY = "brightocity_blog_seo_settings";

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  featureImage: string;
  robots: string;
  twitterTitle: string;
  twitterDescription: string;
}

export type SeoStore = Record<string, SeoSettings>;
export type BlogSeoStore = Record<string | number, SeoSettings>;

export const PAGE_KEYS: { key: string; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "about", label: "About", path: "/about" },
  { key: "blog", label: "Blog", path: "/blog" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "faq", label: "FAQ", path: "/faq" },
  { key: "teams", label: "Teams", path: "/teams" },
  { key: "works", label: "Works", path: "/works" },
  { key: "interior", label: "Interior", path: "/interior" },
  { key: "video-gallery", label: "Video Gallery", path: "/video-gallery" },
  { key: "rate", label: "Rate / Reviews", path: "/rate" },
];

export const defaultSeo: any = {
  title: "Brightocity Interior",
  description:
    "We craft timeless interiors that tell your story. Every space deserves to be extraordinary.",
  keywords: "interior design, home decor, luxury interiors, Brightocity",
  canonicalUrl: "",
  ogTitle: "Brightocity Interior",
  ogDescription:
    "We craft timeless interiors that tell your story. Every space deserves to be extraordinary.",
  ogImage: "",
  featureImage: "",
  robots: "index, follow",
};

function readStore<T extends object>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeStore<T extends object>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Page SEO ────────────────────────────────────────────────────────────────

export function getAllPageSeo(): SeoStore {
  return readStore<SeoStore>(SEO_KEY);
}

export function getPageSeo(pageKey: string): SeoSettings {
  const store = getAllPageSeo();
  return store[pageKey] ? { ...defaultSeo, ...store[pageKey] } : { ...defaultSeo };
}

export function setPageSeo(pageKey: string, settings: SeoSettings): void {
  const store = getAllPageSeo();
  store[pageKey] = settings;
  writeStore(SEO_KEY, store);
}

// ── Blog SEO ────────────────────────────────────────────────────────────────

export function getAllBlogSeo(): BlogSeoStore {
  return readStore<BlogSeoStore>(BLOG_SEO_KEY);
}

export function getBlogSeo(blogId: string | number): SeoSettings {
  const store = getAllBlogSeo();
  return store[blogId] ? { ...defaultSeo, ...store[blogId] } : { ...defaultSeo };
}

export function setBlogSeo(blogId: string | number, settings: SeoSettings): void {
  const store = getAllBlogSeo();
  store[blogId] = settings;
  writeStore(BLOG_SEO_KEY, store);
}

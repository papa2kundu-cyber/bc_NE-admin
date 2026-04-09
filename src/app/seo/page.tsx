"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  seoService,
  blogService,
  PageSeo,
  UpdatePageSeoPayload,
} from "@/services";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, Select, FormActions } from "@/components/admin/FormField";
import { Globe, FileText, Edit2, Search, CheckCircle2, Upload, X } from "lucide-react";
import {
  BlogSeoStore,
  getAllBlogSeo,
  getBlogSeo,
  setBlogSeo,
  defaultSeo,
  SeoSettings
} from "@/lib/seoStore";

const ROBOTS_OPTIONS = [
  { value: "index, follow", label: "index, follow (recommended)" },
  { value: "noindex, follow", label: "noindex, follow" },
  { value: "index, nofollow", label: "index, nofollow" },
  { value: "noindex, nofollow", label: "noindex, nofollow" },
];

const emptyForm: any = {
  title: "",
  description: "",
  keywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  featureImage: "",
  robots: "index, follow",
};

type ModalTarget =
  | { type: "page"; key: string; label: string }
  | { type: "blog"; id: number | string; title: string };

// ── Image Upload Field ───────────────────────────────────────────────────────

function ImageUploadField({
  value,
  preview,
  onChange,
  onFileChange,
  hint,
}: {
  value: string;
  preview: string;
  onChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileChange(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const displayImage = preview || value;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {displayImage ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={displayImage} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2 py-1 text-xs rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                onFileChange(null);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/80 text-white hover:bg-red-600 transition-colors"
            >
              <X size={10} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload size={18} />
          <span className="text-xs">Click to upload image</span>
        </button>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SeoPage() {
  const [activeTab, setActiveTab] = useState<"pages" | "blogs">("pages");
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  // For API pages
  const [pageForm, setPageForm] = useState<UpdatePageSeoPayload>({
    name: "",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    keyword: "",
    robots_directive: "index, follow",
    og_title: "",
    og_description: "",
    feature_image: null,
    og_image: null,
  });

  // For Blog (localStorage based)
  const [blogForm, setBlogForm] = useState<SeoSettings>(defaultSeo);

  // Previews for images
  const [previews, setPreviews] = useState({
    feature_image: "",
    og_image: "",
  });

  const [blogSeoMap, setBlogSeoMap] = useState<BlogSeoStore>({});
  const queryClient = useQueryClient();
  const [toast, setToast] = useState("");

  const refreshBlogMap = useCallback(() => {
    setBlogSeoMap(getAllBlogSeo());
  }, []);

  useEffect(() => {
    refreshBlogMap();
  }, [refreshBlogMap]);

  const { data: pages = [], isLoading: isLoadingPages } = useQuery({
    queryKey: ["pages"],
    queryFn: seoService.getPages,
  });

  const { data: blogs = [] } = useQuery({
    queryKey: ["blogs"],
    queryFn: blogService.getAllBlogs,
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdatePageSeoPayload }) =>
      seoService.updatePageSeo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setToast("SEO settings saved successfully.");
      setTimeout(() => setToast(""), 3000);
      closeModal();
    },
  });

  const openModal = async (target: ModalTarget) => {
    if (target.type === "page") {
      try {
        const details = await seoService.getPageById(target.key);
        setPageForm({
          name: details.name || "",
          meta_title: details.meta_title || "",
          meta_description: details.meta_description || "",
          canonical_url: details.canonical_url || "",
          keyword: details.keyword || "",
          robots_directive: details.robots_directive || "index, follow",
          og_title: details.og_title || "",
          og_description: details.og_description || "",
          feature_image: details.feature_image || null,
          og_image: details.og_image || null,
        });
        setPreviews({
          feature_image: details.feature_image || "",
          og_image: details.og_image || "",
        });
      } catch (err) {
        console.error("Failed to fetch page details", err);
      }
    } else {
      const current = getBlogSeo(target.id);
      setBlogForm({ ...defaultSeo, ...current });
      setPreviews({
        feature_image: current.featureImage || "",
        og_image: current.ogImage || "",
      });
    }
    setModalTarget(target);
  };

  const closeModal = () => setModalTarget(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget) return;

    if (modalTarget.type === "page") {
      updatePageMutation.mutate({ id: modalTarget.key, data: pageForm });
    } else {
      setBlogSeo(modalTarget.id, blogForm);
      refreshBlogMap();
      setToast("Blog SEO settings saved successfully.");
      setTimeout(() => setToast(""), 3000);
      closeModal();
    }
  };

  const modalTitle = modalTarget
    ? modalTarget.type === "page"
      ? `SEO — ${modalTarget.label}`
      : `Blog SEO — ${(modalTarget as { type: "blog"; id: number | string; title: string }).title}`
    : "";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
            SEO Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage meta title, description, Open Graph, canonical URL, and feature
            images for all pages and blog posts.
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 self-start sm:self-auto flex-shrink-0">
          <Globe size={20} className="text-primary" />
        </div>
      </div>

      {/* Success toast */}
      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-0">
        {(["pages", "blogs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab === "pages" ? <Globe size={14} /> : <FileText size={14} />}
            {tab === "pages" ? "Pages" : "Blog Posts"}
          </button>
        ))}
      </div>

      {/* ── Pages tab ─────────────────────────────────────────────────────── */}
      {activeTab === "pages" && (
        <div className="grid grid-cols-1 gap-2">
          {isLoadingPages ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No pages found from API.
            </div>
          ) : (
            pages.map((page) => {
              const hasCustom = !!(page.meta_title);
              return (
                <div
                  key={page.id}
                  className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {page.name}
                      </span>
                      {hasCustom && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          SEO Set
                        </span>
                      )}
                    </div>
                    {page.meta_title && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-medium">
                        {page.meta_title}
                      </p>
                    )}
                    {page.meta_description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {page.meta_description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openModal({ type: "page", key: String(page.id), label: page.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                  >
                    <Edit2 size={12} />
                    Edit SEO
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Blog posts tab ────────────────────────────────────────────────── */}
      {activeTab === "blogs" && (
        <div className="grid grid-cols-1 gap-2">
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Search size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No blog posts found.</p>
              <p className="text-xs mt-1">
                Create blog posts in the{" "}
                <strong className="text-foreground">Blocks</strong> section first.
              </p>
            </div>
          ) : (
            blogs?.length ? blogs.map((blog) => {
              const seo = blogSeoMap[blog.id];
              const hasCustom = !!(seo?.title);
              return (
                <div
                  key={blog.id}
                  className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/40 transition-colors"
                >
                  {blog.image && (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-14 h-12 object-cover rounded-lg border border-border flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {blog.title}
                      </span>
                      {hasCustom && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          SEO Set
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {blog.publish_date} · {blog.username}
                    </p>
                    {seo?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {seo.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      openModal({ type: "blog", id: blog.id, title: blog.title })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                  >
                    <Edit2 size={12} />
                    Edit SEO
                  </button>
                </div>
              );
            }) : "No records found."
          )}
        </div>
      )}

      {/* ── SEO Edit Modal ────────────────────────────────────────────────── */}
      <AdminModal
        title={modalTitle}
        isOpen={modalTarget !== null}
        onClose={closeModal}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">

          {/* Page Info */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Page Info
            </h3>
            <div className="space-y-4">
              <FormField label="Page Name" required hint="Internal name for the page">
                <Input
                  disabled={modalTarget?.type !== "page"}
                  value={modalTarget?.type === "page" ? pageForm.name : ""}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, name: e.target.value }));
                    }
                  }}
                  placeholder="e.g. Home Page"
                  required
                />
              </FormField>
            </div>
          </section>

          {/* Basic SEO */}
          <section className="border-t border-border pt-5">
            <div className="space-y-4">
              <FormField label="Meta Title" required hint="Recommended: 50–60 characters">
                <Input
                  value={modalTarget?.type === "page" ? pageForm.meta_title : blogForm.title}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, meta_title: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, title: e.target.value }));
                    }
                  }}
                  placeholder="e.g. Brightocity Interior — Luxury Home Design"
                  required
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {(modalTarget?.type === "page" ? pageForm.meta_title : blogForm.title).length} / 120
                </p>
              </FormField>

              <FormField label="Meta Description" required hint="Recommended: 150–160 characters">
                <Textarea
                  rows={3}
                  value={modalTarget?.type === "page" ? pageForm.meta_description : blogForm.description}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, meta_description: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, description: e.target.value }));
                    }
                  }}
                  placeholder="Brief description shown in search results..."
                  required
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {(modalTarget?.type === "page" ? pageForm.meta_description : blogForm.description).length} / 300
                </p>
              </FormField>

              <FormField label="Keywords" hint="Comma-separated keywords">
                <Input
                  value={modalTarget?.type === "page" ? pageForm.keyword : blogForm.keywords}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, keyword: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, keywords: e.target.value }));
                    }
                  }}
                  placeholder="e.g. interior design, luxury decor, home renovation"
                />
              </FormField>

              <FormField
                label="Canonical URL"
                hint="Self-referencing URL to prevent duplicate content issues"
              >
                <Input
                  value={modalTarget?.type === "page" ? pageForm.canonical_url : blogForm.canonicalUrl}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, canonical_url: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, canonicalUrl: e.target.value }));
                    }
                  }}
                  placeholder="https://example.com/page-url"
                  type="url"
                />
              </FormField>

              <FormField label="Robots Directive">
                <Select
                  options={ROBOTS_OPTIONS}
                  value={modalTarget?.type === "page" ? pageForm.robots_directive : blogForm.robots}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, robots_directive: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, robots: e.target.value }));
                    }
                  }}
                />
              </FormField>
            </div>
          </section>

          {/* Feature Image */}
          <section className="border-t border-border pt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Feature Image
            </h3>
            <FormField
              label="Feature Image"
              hint="Hero / thumbnail image for this page or post"
            >
              <ImageUploadField
                value={modalTarget?.type === "page"
                  ? (typeof pageForm.feature_image === "string" ? pageForm.feature_image : "")
                  : blogForm.featureImage}
                preview={previews.feature_image}
                onChange={(url) => setPreviews(p => ({ ...p, feature_image: url }))}
                onFileChange={(file) => {
                  if (modalTarget?.type === "page") {
                    setPageForm(f => ({ ...f, feature_image: file }));
                  } else {
                    // For blogs we use base64 for now as per original
                    // Actually we can just wait for the onChange to update the preview
                    // and then handled in blogForm if it was designed to take URLs
                  }
                }}
                hint="Used as fallback OG image if no OG image is set"
              />
            </FormField>
          </section>

          {/* Open Graph */}
          <section className="border-t border-border pt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Open Graph (Social Sharing)
            </h3>
            <div className="space-y-4">
              <FormField label="OG Title" hint="Leave blank to use Meta Title">
                <Input
                  value={modalTarget?.type === "page" ? pageForm.og_title : blogForm.ogTitle}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, og_title: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, ogTitle: e.target.value }));
                    }
                  }}
                  placeholder="Fallback: uses Meta Title"
                />
              </FormField>

              <FormField
                label="OG Description"
                hint="Leave blank to use Meta Description"
              >
                <Textarea
                  rows={2}
                  value={modalTarget?.type === "page" ? pageForm.og_description : blogForm.ogDescription}
                  onChange={(e) => {
                    if (modalTarget?.type === "page") {
                      setPageForm((f) => ({ ...f, og_description: e.target.value }));
                    } else {
                      setBlogForm((f) => ({ ...f, ogDescription: e.target.value }));
                    }
                  }}
                  placeholder="Fallback: uses Meta Description"
                />
              </FormField>

              <FormField
                label="OG Image"
                hint="Upload share image (1200×630 px recommended)"
              >
                <ImageUploadField
                  value={modalTarget?.type === "page"
                    ? (typeof pageForm.og_image === "string" ? pageForm.og_image : "")
                    : blogForm.ogImage}
                  preview={previews.og_image}
                  onChange={(url) => {
                    setPreviews(p => ({ ...p, og_image: url }));
                    if (modalTarget?.type === "blog") {
                      setBlogForm(f => ({ ...f, ogImage: url }));
                    }
                  }}
                  onFileChange={(file) => {
                    if (modalTarget?.type === "page") {
                      setPageForm(f => ({ ...f, og_image: file }));
                    }
                  }}
                  hint="Overrides Feature Image for social sharing previews"
                />
              </FormField>
            </div>
          </section>

          <FormActions onCancel={closeModal} isEdit isLoading={updatePageMutation.isPending} />
        </form>
      </AdminModal>
    </div>
  );
}

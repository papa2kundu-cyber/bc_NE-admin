"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/services";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, Select, FormActions } from "@/components/admin/FormField";
import { FileText, Loader2, ChevronDown, Globe } from "lucide-react";
import { SeoSettings, getBlogSeo, setBlogSeo } from "@/lib/seoStore";

const CATEGORIES = [
  { value: "Design Trends", label: "Design Trends" },
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Tips & Tricks", label: "Tips & Tricks" },
  { value: "Project Showcase", label: "Project Showcase" },
  { value: "News", label: "News" },
  { value: "Other", label: "Other" },
];

const ROBOTS_OPTIONS = [
  { value: "index, follow", label: "index, follow (recommended)" },
  { value: "noindex, follow", label: "noindex, follow" },
  { value: "index, nofollow", label: "index, nofollow" },
  { value: "noindex, nofollow", label: "noindex, nofollow" },
];

const emptyForm = {
  category_id: "1",
  title: "",
  description: "",
  username: "",
  publish_date: new Date().toISOString().split("T")[0],
};

const emptySeo: any = {
  title: "",
  description: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  robots: "index, follow",
};

type BlogRow = Awaited<ReturnType<typeof blogService.getAllBlogs>>[0];

export default function BlocksPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ── SEO state ────────────────────────────────────────────────────────────
  const [seoForm, setSeoForm] = useState<SeoSettings>(emptySeo);
  const seoFormRef = useRef<SeoSettings>(emptySeo); // keeps latest value for mutation callbacks
  const [seoExpanded, setSeoExpanded] = useState(false);

  /** Update SEO form and keep the ref in sync (needed inside mutation onSuccess). */
  const setSeo = (updater: (prev: SeoSettings) => SeoSettings) => {
    setSeoForm((prev) => {
      const next = updater(prev);
      seoFormRef.current = next;
      return next;
    });
  };

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: blogService.getAllBlogs,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: blogService.addBlog,
    onSuccess: (newBlog) => {
      // Persist SEO for the newly created blog post (ID comes from the API response)
      setBlogSeo(newBlog.id, seoFormRef.current);
      qc.invalidateQueries({ queryKey: ["blogs"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof blogService.editBlog>[1] }) =>
      blogService.editBlog(id, data),
    onSuccess: (_, variables) => {
      // Update SEO for the existing blog post
      setBlogSeo(variables.id, seoFormRef.current);
      qc.invalidateQueries({ queryKey: ["blogs"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => blogService.deleteBlog(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blogs"] }); setDeleteId(null); },
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const resetSeo = (seo: SeoSettings = emptySeo) => {
    setSeoForm(seo);
    seoFormRef.current = seo;
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    resetSeo();
    setSeoExpanded(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setImagePreview("");
    setImageFile(null);
    resetSeo();
    setSeoExpanded(false);
    setModalOpen(true);
  };

  const openEdit = (block: BlogRow) => {
    setEditId(block.id);
    setForm({
      category_id: String(block.category_id ?? "1"),
      title: block.title,
      description: block.description ?? "",
      username: block.username ?? "",
      publish_date: block.publish_date ?? new Date().toISOString().split("T")[0],
    });
    setImagePreview(block.image ?? "");
    setImageFile(null);
    // Pre-fill SEO from localStorage (if admin set it before)
    resetSeo(getBlogSeo(block.id));
    setSeoExpanded(false);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category_id: form.category_id,
      title: form.title,
      description: form.description,
      username: form.username,
      publish_date: form.publish_date,
      ...(imageFile ? { image: imageFile } : {}),
    };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: Column<BlogRow>[] = [
    {
      key: "image",
      label: "Image",
      render: (row) =>
        row.image ? (
          <img src={row.image} alt={row.title} className="w-12 h-10 object-cover rounded-md border border-border" />
        ) : (
          <div className="w-12 h-10 rounded-md border border-border bg-muted flex items-center justify-center">
            <FileText size={14} className="text-muted-foreground" />
          </div>
        ),
    },
    { key: "title", label: "Title" },
    {
      key: "category_id",
      label: "Category",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          {row.category_id}
        </span>
      ),
    },
    { key: "username", label: "Author" },
    { key: "publish_date", label: "Published" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader
        title="Blocks (Blog Posts)"
        description="Create and manage blog content blocks."
        onAdd={openAdd}
        addLabel="Add Block"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading blocks…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={blocks}
          onEdit={openEdit}
          onDelete={(id) => setDeleteId(Number(id))}
          emptyMessage="No blocks yet. Click 'Add Block' to get started."
        />
      )}

      {/* ── Add / Edit modal ─────────────────────────────────────────────── */}
      <AdminModal
        title={editId !== null ? "Edit Block" : "Add New Block"}
        isOpen={modalOpen}
        onClose={closeModal}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Blog fields ───────────────────────────────────────────────── */}
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Top Interior Trends 2025"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Category" required>
              <Select
                options={CATEGORIES}
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              />
            </FormField>
            <FormField label="Author / Username" required>
              <Input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. Admin"
                required
              />
            </FormField>
          </div>

          <FormField label="Publish Date" required>
            <Input
              type="date"
              value={form.publish_date}
              onChange={(e) => setForm((f) => ({ ...f, publish_date: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Description" required>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Write the block content here..."
              required
            />
          </FormField>

          <FormField label="Cover Image" hint="Upload a cover image (JPG, PNG, WebP).">
            <div className="space-y-2">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
              )}
            </div>
          </FormField>

          {/* ── SEO collapsible section ───────────────────────────────────── */}
          <div className="border border-border rounded-xl overflow-hidden">
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => setSeoExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">SEO Settings</span>
                <span className="text-xs text-muted-foreground">(optional)</span>
                {(seoForm.title || seoForm.description) && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Set
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-foreground transition-transform duration-200 flex-shrink-0 ${seoExpanded ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* SEO fields */}
            {seoExpanded && (
              <div className="px-4 pb-4 pt-3 space-y-5 border-t border-border">

                {/* Basic SEO */}
                <div className="space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Basic SEO
                  </p>

                  <FormField label="Meta Title" hint="Recommended: 50–60 characters">
                    <Input
                      value={seoForm.title}
                      onChange={(e) => setSeo((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Top Interior Trends 2025 | Brightocity"
                      maxLength={120}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {seoForm.title.length} / 120
                    </p>
                  </FormField>

                  <FormField label="Meta Description" hint="Recommended: 150–160 characters">
                    <Textarea
                      rows={2}
                      value={seoForm.description}
                      onChange={(e) => setSeo((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description shown in search results..."
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {seoForm.description.length} / 300
                    </p>
                  </FormField>

                  <FormField label="Keywords" hint="Comma-separated">
                    <Input
                      value={seoForm.keywords}
                      onChange={(e) => setSeo((f) => ({ ...f, keywords: e.target.value }))}
                      placeholder="e.g. interior design, luxury decor"
                    />
                  </FormField>

                  <FormField label="Robots">
                    <Select
                      options={ROBOTS_OPTIONS}
                      value={seoForm.robots}
                      onChange={(e) => setSeo((f) => ({ ...f, robots: e.target.value }))}
                    />
                  </FormField>
                </div>

                {/* Open Graph */}
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Open Graph (Social Sharing)
                  </p>

                  <FormField label="OG Title" hint="Leave blank to use Meta Title">
                    <Input
                      value={seoForm.ogTitle}
                      onChange={(e) => setSeo((f) => ({ ...f, ogTitle: e.target.value }))}
                      placeholder="Fallback: uses Meta Title"
                    />
                  </FormField>

                  <FormField label="OG Description" hint="Leave blank to use Meta Description">
                    <Textarea
                      rows={2}
                      value={seoForm.ogDescription}
                      onChange={(e) => setSeo((f) => ({ ...f, ogDescription: e.target.value }))}
                      placeholder="Fallback: uses Meta Description"
                    />
                  </FormField>

                  <FormField label="OG Image URL" hint="Full URL — 1200×630 px recommended">
                    <Input
                      value={seoForm.ogImage}
                      onChange={(e) => setSeo((f) => ({ ...f, ogImage: e.target.value }))}
                      placeholder="https://example.com/og-image.jpg"
                    />
                  </FormField>
                </div>

                {/* Twitter / X */}
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Twitter / X Card
                  </p>

                  <FormField label="Twitter Title" hint="Leave blank to use Meta Title">
                    <Input
                      value={seoForm.twitterTitle}
                      onChange={(e) => setSeo((f) => ({ ...f, twitterTitle: e.target.value }))}
                      placeholder="Fallback: uses Meta Title"
                    />
                  </FormField>

                  <FormField label="Twitter Description" hint="Leave blank to use Meta Description">
                    <Textarea
                      rows={2}
                      value={seoForm.twitterDescription}
                      onChange={(e) => setSeo((f) => ({ ...f, twitterDescription: e.target.value }))}
                      placeholder="Fallback: uses Meta Description"
                    />
                  </FormField>
                </div>

              </div>
            )}
          </div>

          {(addMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save block. Please try again.</p>
          )}

          <FormActions onCancel={closeModal} isEdit={editId !== null} isLoading={isPending} />
        </form>
      </AdminModal>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <AdminModal
        title="Confirm Delete"
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
      >
        <p className="text-muted-foreground text-sm">
          Are you sure you want to delete this block? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive hover:bg-destructive/90 text-white transition-colors disabled:opacity-60"
          >
            {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

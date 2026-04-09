"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photoService } from "@/services";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, Select, FormActions } from "@/components/admin/FormField";
import { ImageIcon, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "1", label: "Living Room" },
  { value: "2", label: "Bedroom" },
  { value: "3", label: "Kitchen" },
  { value: "4", label: "Bathroom" },
  { value: "5", label: "Office" },
  { value: "6", label: "Dining Room" },
  { value: "7", label: "Other" },
];

const emptyForm = { category_id: "1", title: "", description: "" };
type PhotoRow = Awaited<ReturnType<typeof photoService.getAllPhotos>>[0];

export default function PhotosPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: photoService.getAllPhotos,
  });

  const addMutation = useMutation({
    mutationFn: photoService.addPhoto,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof photoService.updatePhoto>[1] }) =>
      photoService.updatePhoto(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => photoService.deletePhoto(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); setDeleteId(null); },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setImagePreview(""); setImageFile(null); setModalOpen(true); };

  const openEdit = (photo: PhotoRow) => {
    setEditId(photo.id);
    setForm({ category_id: String(photo.category_id ?? "1"), title: photo.title, description: photo.description ?? "" });
    setImagePreview(photo.images?.[0] ?? "");
    setImageFile(null);
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
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: { category_id: form.category_id, title: form.title, description: form.description, ...(imageFile ? { images: [imageFile] } : {}) } });
    } else {
      addMutation.mutate({ category_id: form.category_id, title: form.title, description: form.description, images: imageFile ? [imageFile] : [] });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const columns: Column<PhotoRow>[] = [
    {
      key: "images",
      label: "Image",
      render: (row) =>
        row.images?.[0] ? (
          <img src={row.images[0]} alt={row.title} className="w-12 h-10 object-cover rounded-md border border-border" />
        ) : (
          <div className="w-12 h-10 rounded-md border border-border bg-muted flex items-center justify-center">
            <ImageIcon size={16} className="text-muted-foreground" />
          </div>
        ),
    },
    { key: "title", label: "Title" },
    {
      key: "category_id",
      label: "Category",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {CATEGORIES.find((c) => c.value === String(row.category_id))?.label ?? row.category_id}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="line-clamp-1 text-muted-foreground">
          {(row.description ?? "").slice(0, 40)}{(row.description?.length ?? 0) > 40 ? "…" : ""}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader title="Photos" description="Manage your interior design photo gallery." onAdd={openAdd} addLabel="Add Photo" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading photos…
        </div>
      ) : (
        <AdminTable columns={columns} data={photos} onEdit={openEdit} onDelete={(id) => setDeleteId(Number(id))} emptyMessage="No photos yet. Click 'Add Photo' to get started." />
      )}

      <AdminModal title={editId !== null ? "Edit Photo" : "Add New Photo"} isOpen={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Modern Living Room" required />
          </FormField>
          <FormField label="Category" required>
            <Select options={CATEGORIES} value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
          </FormField>
          <FormField label="Image" hint="Upload an image (JPG, PNG, WebP).">
            <div className="space-y-2">
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />}
            </div>
          </FormField>
          {(addMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save photo. Please try again.</p>
          )}
          <FormActions onCancel={closeModal} isEdit={editId !== null} isLoading={isPending} />
        </form>
      </AdminModal>

      <AdminModal title="Confirm Delete" isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <p className="text-muted-foreground text-sm">Are you sure you want to delete this photo? This action cannot be undone.</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive hover:bg-destructive/90 text-white transition-colors disabled:opacity-60">
            {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />} Delete
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

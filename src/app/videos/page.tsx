"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoService } from "@/services";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, FormActions } from "@/components/admin/FormField";
import { Video as VideoIcon, Loader2 } from "lucide-react";

const emptyForm = { title: "", description: "", video_url: "" };
type VideoRow = Awaited<ReturnType<typeof videoService.getAllVideos>>[0];

export default function VideosPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: videoService.getAllVideos,
  });

  const addMutation = useMutation({
    mutationFn: videoService.addVideo,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof videoService.editVideo>[1] }) =>
      videoService.editVideo(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => videoService.deleteVideo(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); setDeleteId(null); },
  });

  const closeModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (video: VideoRow) => {
    setEditId(video.id);
    setForm({ title: video.title, description: video.description ?? "", video_url: video.video_url ?? "" });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: { title: form.title, description: form.description, video_url: form.video_url } });
    } else {
      addMutation.mutate({ title: form.title, description: form.description, video_url: form.video_url });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const columns: Column<VideoRow>[] = [
    {
      key: "video_url",
      label: "Preview",
      render: (row) => (
        <div className="w-16 h-10 rounded-md border border-border bg-muted flex items-center justify-center">
          <VideoIcon size={16} className={row.video_url ? "text-primary" : "text-muted-foreground"} />
        </div>
      ),
    },
    { key: "title", label: "Title" },
    {
      key: "description",
      label: "Description",
      render: (row) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{row.description}</span>,
    },
    {
      key: "video_url",
      label: "Video URL",
      render: (row) => <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{row.video_url}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader title="Videos" description="Manage your interior design video gallery." onAdd={openAdd} addLabel="Add Video" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading videos…
        </div>
      ) : (
        <AdminTable columns={columns} data={videos} onEdit={openEdit} onDelete={(id) => setDeleteId(Number(id))} emptyMessage="No videos yet. Click 'Add Video' to get started." />
      )}

      <AdminModal title={editId !== null ? "Edit Video" : "Add New Video"} isOpen={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Interior Showcase 2025" required />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
          </FormField>
          <FormField label="Video URL" required hint="Paste a YouTube embed URL, Vimeo URL, or a direct .mp4 link.">
            <Input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://www.youtube.com/embed/..." required />
          </FormField>
          {form.video_url && (
            <div className="rounded-lg overflow-hidden border border-border aspect-video w-full">
              <iframe src={form.video_url} className="w-full h-full" allowFullScreen title="Video preview" />
            </div>
          )}
          {(addMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save video. Please try again.</p>
          )}
          <FormActions onCancel={closeModal} isEdit={editId !== null} isLoading={isPending} />
        </form>
      </AdminModal>

      <AdminModal title="Confirm Delete" isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <p className="text-muted-foreground text-sm">Are you sure you want to delete this video? This action cannot be undone.</p>
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

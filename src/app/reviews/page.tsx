"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ratingService } from "@/services";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, FormActions } from "@/components/admin/FormField";
import { Star, Send, Loader2, X, ImageIcon } from "lucide-react";

type RatingRow = Awaited<ReturnType<typeof ratingService.getAllRatings>>[0];

const emptyForm = { name: "", email: "", rating: 5, description: "", images: [] as string[] };
const emptySendForm = { name: "", email: "" };

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="transition-colors" style={{ color: star <= value ? "#dd7139" : "#e5e7eb" }}>
          <Star size={22} fill={star <= value ? "#dd7139" : "none"} />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{value} / 5</span>
    </div>
  );
}

function buildRatingLink(name: string, email: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/rate?${new URLSearchParams({ name, email }).toString()}`;
}

function dispatchRatingEmail(name: string, email: string) {
  const link = buildRatingLink(name, email);
  const subject = encodeURIComponent("We'd love your feedback — Rate Your Experience");
  const body = encodeURIComponent(`Hi ${name},\n\nThank you for choosing us! We'd love to hear your thoughts:\n\n${link}\n\nWarm regards,\nBrightocity Interior`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState(emptySendForm);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["ratings"],
    queryFn: ratingService.getAllRatings,
  });

  const sendMutation = useMutation({
    mutationFn: ratingService.submitRatingRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ratings"] }); setSendModalOpen(false); setSendForm(emptySendForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ratingService.deleteRating(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ratings"] }); setDeleteId(null); },
  });

  const closeModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (review: RatingRow) => {
    setEditId(review.id);
    setForm({ name: review.name ?? "", email: review.email ?? "", rating: review.rating ?? 5, description: review.description ?? "", images: [] });
    setModalOpen(true);
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - form.images.length;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, images: [...f.images, reader.result as string].slice(0, 5) }));
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchRatingEmail(sendForm.name, sendForm.email);
    sendMutation.mutate({ name: sendForm.name, email: sendForm.email });
  };

  const columns: Column<RatingRow>[] = [
    {
      key: "allowed",
      label: "Status",
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.allowed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {row.allowed ? "Approved" : "Pending"}
        </span>
      ),
    },
    {
      key: "name",
      label: "Reviewer",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={13} style={{ color: s <= (row.rating ?? 0) ? "#dd7139" : "#e5e7eb" }} fill={s <= (row.rating ?? 0) ? "#dd7139" : "none"} />
          ))}
        </div>
      ),
    },
    {
      key: "description",
      label: "Review",
      render: (row) => <span className="line-clamp-1 max-w-xs text-muted-foreground text-sm">{(row.description ?? "").slice(0, 40)}{(row.description?.length ?? 0) > 40 ? "…" : ""}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer reviews and testimonials.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => { setSendForm(emptySendForm); setSendModalOpen(true); }} className="flex items-center gap-2 border border-border hover:bg-muted text-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Send size={15} /> Send Review Link
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading reviews…
        </div>
      ) : (
        <AdminTable columns={columns} data={reviews} onEdit={openEdit} onDelete={(id) => setDeleteId(Number(id))} emptyMessage="No reviews yet." />
      )}

      {/* Edit Modal */}
      <AdminModal title="View Review" isOpen={modalOpen} onClose={closeModal} size="lg">
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Name"><Input value={form.name} readOnly className="bg-muted/30" /></FormField>
            <FormField label="Email"><Input value={form.email} readOnly className="bg-muted/30" /></FormField>
          </div>
          <FormField label="Rating"><StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} /></FormField>
          <FormField label="Review Text"><Textarea rows={4} value={form.description} readOnly className="bg-muted/30" /></FormField>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Close</button>
          </div>
        </form>
      </AdminModal>

      {/* Send Review Link Modal */}
      <AdminModal title="Send Review Link" isOpen={sendModalOpen} onClose={() => setSendModalOpen(false)} size="sm">
        <p className="text-sm text-muted-foreground mb-4">Enter the customer's name and email to send them a personalised review link.</p>
        <form onSubmit={handleSendLink} className="space-y-4">
          <FormField label="Customer Name" required>
            <Input value={sendForm.name} onChange={(e) => setSendForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" required />
          </FormField>
          <FormField label="Customer Email" required>
            <Input type="email" value={sendForm.email} onChange={(e) => setSendForm((f) => ({ ...f, email: e.target.value }))} placeholder="e.g. john@example.com" required />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setSendModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={sendMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-60">
              {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Link
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirm */}
      <AdminModal title="Confirm Delete" isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <p className="text-muted-foreground text-sm">Are you sure you want to delete this review? This action cannot be undone.</p>
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

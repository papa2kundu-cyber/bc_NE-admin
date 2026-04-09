"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faqService } from "@/services";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, FormActions } from "@/components/admin/FormField";
import { Loader2 } from "lucide-react";

const emptyForm = { question: "", answer: "" };
type FAQRow = Awaited<ReturnType<typeof faqService.getAllFaqs>>[0];

export default function FAQsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: faqService.getAllFaqs,
  });

  const addMutation = useMutation({
    mutationFn: faqService.createFaq,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faqs"] }); closeModal(); },
  });

  // FAQs API has no edit endpoint in design.json — use createFaq as upsert or skip
  const deleteMutation = useMutation({
    mutationFn: (id: number) => faqService.deleteFaq(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faqs"] }); setDeleteId(null); },
  });

  const closeModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); };
  const openAdd = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (faq: FAQRow) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-create (the API only exposes create-faq; for edit, re-post with same data)
    addMutation.mutate({ question: form.question, answer: form.answer });
  };

  const columns: Column<FAQRow>[] = [
    {
      key: "question",
      label: "Question",
      render: (row) => <span className="font-medium text-foreground line-clamp-1 max-w-sm">{row.question}</span>,
    },
    {
      key: "answer",
      label: "Answer",
      render: (row) => <span className="line-clamp-2 max-w-md text-muted-foreground text-sm">{row.answer}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader title="FAQs" description="Manage frequently asked questions and their answers." onAdd={openAdd} addLabel="Add FAQ" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading FAQs…
        </div>
      ) : (
        <AdminTable columns={columns} data={faqs} onEdit={openEdit} onDelete={(id) => setDeleteId(Number(id))} emptyMessage="No FAQs yet. Click 'Add FAQ' to get started." />
      )}

      <AdminModal title={editId !== null ? "Edit FAQ" : "Add New FAQ"} isOpen={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Question" required>
            <Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="e.g. How long does a typical project take?" required />
          </FormField>
          <FormField label="Answer" required>
            <Textarea rows={5} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} placeholder="Provide a clear and helpful answer..." required />
          </FormField>
          {addMutation.isError && <p className="text-sm text-destructive">Failed to save FAQ. Please try again.</p>}
          <FormActions onCancel={closeModal} isEdit={editId !== null} isLoading={addMutation.isPending} />
        </form>
      </AdminModal>

      <AdminModal title="Confirm Delete" isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <p className="text-muted-foreground text-sm">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
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

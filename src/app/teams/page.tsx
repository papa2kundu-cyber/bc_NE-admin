"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable, { Column } from "@/components/admin/AdminTable";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, Textarea, FormActions } from "@/components/admin/FormField";
import { UserCircle, Loader2 } from "lucide-react";

const emptyForm = { name: "", designation: "", description: "" };
type TeamRow = Awaited<ReturnType<typeof teamService.getAllTeams>>[0];

export default function TeamsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: team = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: teamService.getAllTeams,
  });

  const addMutation = useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof teamService.editTeam>[1] }) =>
      teamService.editTeam(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teamService.deleteTeam(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); setDeleteId(null); },
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

  const openEdit = (member: TeamRow) => {
    setEditId(member.id);
    setForm({ name: member.name, designation: member.designation ?? "", description: member.description ?? "" });
    setImagePreview(member.image ?? "");
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
    const payload = { name: form.name, designation: form.designation, description: form.description, ...(imageFile ? { image: imageFile } : {}) };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const columns: Column<TeamRow>[] = [
    { key: "id", label: "ID" },
    {
      key: "image",
      label: "Photo",
      render: (row) =>
        row.image ? (
          <img src={row.image} alt={row.name} className="w-10 h-10 object-cover rounded-full border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-full border border-border bg-muted flex items-center justify-center">
            <UserCircle size={20} className="text-muted-foreground" />
          </div>
        ),
    },
    { key: "name", label: "Name" },
    {
      key: "designation",
      label: "Designation",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {row.designation || "N/A"}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="line-clamp-1 max-w-xs text-muted-foreground italic">
          {row.description || "No description provided."}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminPageHeader title="Team Members" description="Manage your interior design team." onAdd={openAdd} addLabel="Add Member" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading team…
        </div>
      ) : (
        <AdminTable columns={columns} data={team} onEdit={openEdit} onDelete={(id) => setDeleteId(Number(id))} emptyMessage="No team members yet. Click 'Add Member' to get started." />
      )}

      <AdminModal title={editId !== null ? "Edit Team Member" : "Add Team Member"} isOpen={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah Johnson" required />
          </FormField>
          <FormField label="Designation" required>
            <Input value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="e.g. Lead Designer" required />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short bio..." />
          </FormField>
          <FormField label="Profile Photo" hint="Upload a photo (JPG, PNG, WebP).">
            <div className="space-y-2">
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              {imagePreview && (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-full border border-border" />
                  <span className="text-sm text-muted-foreground">Profile photo preview</span>
                </div>
              )}
            </div>
          </FormField>
          {(addMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">Failed to save team member. Please try again.</p>
          )}
          <FormActions onCancel={closeModal} isEdit={editId !== null} isLoading={isPending} />
        </form>
      </AdminModal>

      <AdminModal title="Confirm Delete" isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <p className="text-muted-foreground text-sm">Are you sure you want to remove this team member? This action cannot be undone.</p>
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

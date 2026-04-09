"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/axios";
import AdminModal from "@/components/admin/AdminModal";
import { Mail, Phone, User, Calendar, Eye, Loader2 } from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at?: string;
}

async function getAllContacts(): Promise<ContactMessage[]> {
  const res: any = await apiClient.get<ContactMessage[]>("/get-all-contacts");
  return res.data.data;
}

export default function ContactsPage() {
  const [viewItem, setViewItem] = useState<ContactMessage | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: getAllContacts,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Contact Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">View messages submitted through the Contact Us form.</p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={15} className="text-primary" />
          <span>Total Messages:</span>
          <span className="font-semibold text-foreground">{contacts.length}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading messages…
        </div>
      ) : contacts.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center text-muted-foreground">
          <Mail size={32} className="mx-auto mb-3 opacity-30" />
          <p>No contact messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-background border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <User size={14} className="text-primary flex-shrink-0" />{contact.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail size={13} className="flex-shrink-0" />{contact.email}
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone size={13} className="flex-shrink-0" />{contact.phone}
                      </div>
                    )}
                    {contact.created_at && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} className="flex-shrink-0" />{contact.created_at}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{contact.message}</p>
                </div>
                <button onClick={() => setViewItem(contact)} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="View full message">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Message Modal */}
      <AdminModal title="Message Details" isOpen={!!viewItem} onClose={() => setViewItem(null)}>
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Name</p>
                <p className="text-sm text-foreground font-medium">{viewItem.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Date</p>
                <p className="text-sm text-foreground">{viewItem.created_at ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Email</p>
                <a href={`mailto:${viewItem.email}`} className="text-sm text-primary hover:underline">{viewItem.email}</a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Phone</p>
                <p className="text-sm text-foreground">{viewItem.phone || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Message</p>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground leading-relaxed">{viewItem.message}</div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Close</button>
              <a href={`mailto:${viewItem.email}?subject=Re: Your inquiry`} className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors">
                Reply via Email
              </a>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

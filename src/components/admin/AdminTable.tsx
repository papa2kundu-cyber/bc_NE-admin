"use client";

import { Pencil, Trash2 } from "lucide-react";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

interface AdminTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  onEdit: (row: T) => void;
  onDelete: (id: string | number) => void;
  emptyMessage?: string;
  extraActions?: (row: T) => React.ReactNode;
}

export default function AdminTable<T extends { id: string | number }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "No records found.",
  extraActions,
}: AdminTableProps<T>) {

  // ── Shared empty state ──────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="border border-border rounded-xl px-4 py-12 text-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  // ── Action buttons (reused in both views) ───────────────────────────
  const ActionButtons = ({ row }: { row: T }) => (
    <div className="flex items-center gap-1.5">
      {extraActions && extraActions(row)}
      <button
        onClick={() => onEdit(row)}
        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        title="Edit"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => onDelete(row.id)}
        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <>
      {/* ── CARD VIEW — mobile & tablet (hidden on lg+) ─────────────── */}
      <div className="lg:hidden space-y-3">
        {data?.length ? data.map((row) => (
          <div
            key={row.id}
            className="bg-background border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors"
          >
            {/* Fields */}
            <div className="space-y-2.5">
              {columns.map((col) => {
                const value = col.render
                  ? col.render(row)
                  : String((row as any)[col.key] ?? "");
                return (
                  <div key={String(col.key)} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex-shrink-0 pt-0.5 leading-tight">
                      {col.label}
                    </span>
                    <div className="flex-1 text-sm text-foreground min-w-0">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action row */}
            <div className="flex items-center justify-end pt-2.5 border-t border-border">
              <ActionButtons row={row} />
            </div>
          </div>
        )) : <div className="w-full py-8 text-center">No records found.</div>}
      </div>

      {/* ── TABLE VIEW — desktop (hidden below lg) ──────────────────── */}
      <div className="hidden lg:block border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wide text-xs whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wide text-xs whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? data.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    } hover:bg-primary/5 transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-foreground">
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <ActionButtons row={row} />
                  </td>
                </tr>
              )) : <tr><td colSpan={columns.length + 1} className="w-full py-8 text-center">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

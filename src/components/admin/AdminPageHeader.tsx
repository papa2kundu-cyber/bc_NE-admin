import { Plus } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  onAdd: () => void;
  addLabel?: string;
}

export default function AdminPageHeader({
  title,
  description,
  onAdd,
  addLabel = "Add New",
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm self-start sm:self-auto flex-shrink-0"
      >
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}

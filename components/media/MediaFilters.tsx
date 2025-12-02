"use client";

import { Input } from "@/components/ui/Input";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  tag: string;
  onTagChange: (value: string) => void;
};

export function MediaFilters({
  search,
  onSearchChange,
  clientName,
  onClientNameChange,
  tag,
  onTagChange,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search captions and clients..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
        />
        <Input
          placeholder="Filter by client..."
          value={clientName}
          onChange={(e) => onClientNameChange(e.target.value)}
          fullWidth
        />
        <Input
          placeholder="Filter by tag..."
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          fullWidth
        />
      </div>
    </div>
  );
}

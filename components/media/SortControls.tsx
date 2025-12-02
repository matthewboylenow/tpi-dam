"use client";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
};

export function SortControls({ sortBy, sortOrder, onSortChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700">Sort by:</span>

      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [newSortBy, newSortOrder] = e.target.value.split("-") as [
            SortBy,
            SortOrder
          ];
          onSortChange(newSortBy, newSortOrder);
        }}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
      >
        <option value="created_at-desc">Newest First</option>
        <option value="created_at-asc">Oldest First</option>
        <option value="caption-asc">Caption (A-Z)</option>
        <option value="caption-desc">Caption (Z-A)</option>
      </select>

      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={() =>
            onSortChange(sortBy, sortOrder === "desc" ? "asc" : "desc")
          }
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title={sortOrder === "desc" ? "Sort Ascending" : "Sort Descending"}
        >
          {sortOrder === "desc" ? (
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

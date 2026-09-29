type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
      {icon && (
        <div className="w-12 h-12 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

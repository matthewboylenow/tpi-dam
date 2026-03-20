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
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {icon ? (
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

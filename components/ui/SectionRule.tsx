type Props = {
  label: string;
  count?: number;
  /** Optional control rendered at the right end of the rule. */
  action?: React.ReactNode;
};

/** Section heading: small mono label, count, hairline. */
export function SectionRule({ label, count, action }: Props) {
  return (
    <div className="section-rule">
      <span className="eyebrow text-slate-700 dark:text-slate-200">{label}</span>
      {typeof count === "number" && (
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{count}</span>
      )}
      {action && <span className="order-last ml-3 -my-1">{action}</span>}
    </div>
  );
}

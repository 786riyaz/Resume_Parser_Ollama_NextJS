type ProgressBarProps = {
value: number;
label: string;
};
export function ProgressBar({ value, label }: ProgressBarProps) {
const safeValue = Math.min(100, Math.max(0, value));
return (
<div className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
<div className="mb-3 flex items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
<span>{label}</span>
<strong className="tabular-nums text-[var(--text-primary)]">{safeValue}%</strong>
</div>
<div className="h-3 overflow-hidden rounded-full bg-[var(--pill-bg)]">
<div
className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
style={{ width: `${safeValue}%` }}
/>
</div>
</div>
);
}

type ProgressBarProps = {
  value: number;
  label: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full rounded-md border border-[#d7dce5] bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-[#445064]">
        <span>{label}</span>
        <strong className="tabular-nums text-[#172033]">{safeValue}%</strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e8edf4]">
        <div
          className="h-full rounded-full bg-[#2f6fed] transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}


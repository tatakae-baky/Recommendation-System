import { ArrowUpRight } from "lucide-react";
import { formatPercent } from "../utils/formatters.js";

export default function MetricCard({ label, value, comparison, uplift }) {
  const numericValue = Number(value) || 0;
  const barWidth = `${Math.min(100, Math.max(2, numericValue * 100 * 10))}%`;

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-700">{label}</p>
        {uplift !== null && uplift !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
            <ArrowUpRight aria-hidden="true" size={13} />
            {formatPercent(uplift, 1)}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-stone-950">{formatPercent(value)}</p>
      {comparison !== null && comparison !== undefined && (
        <p className="mt-1 text-xs text-stone-500">Popularity: {formatPercent(comparison)}</p>
      )}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: barWidth }} />
      </div>
    </article>
  );
}

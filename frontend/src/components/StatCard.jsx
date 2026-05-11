import { formatNumber } from "../utils/formatters.js";

export default function StatCard({ label, value, tone = "stone" }) {
  const toneClass = {
    stone: "bg-white border-stone-200",
    rose: "bg-rose-50 border-rose-100",
    emerald: "bg-emerald-50 border-emerald-100",
    sky: "bg-sky-50 border-sky-100",
  }[tone];

  const valueText = formatNumber(value);
  const valueClass =
    typeof valueText === "string" && valueText.length > 18
      ? "text-lg leading-6 break-words"
      : "text-2xl";

  return (
    <article className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-2 font-semibold text-stone-950 ${valueClass}`}>{valueText}</p>
    </article>
  );
}

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { fallbackLabel, getImageUrl } from "../utils/imageFallback.js";
import { formatScore } from "../utils/formatters.js";

export default function ProductCard({
  item,
  onSelect,
  scoreLabel = "Score",
  showMethod = false,
  showWhy = false,
  ctaLabel = "Open item",
  variant = "default",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getImageUrl(item);
  const clickable = Boolean(onSelect);
  const isSimilar = variant === "similar";
  const reasonParts = [
    item.product_type_name,
    item.garment_group_name,
    item.section_name,
    item.colour_group_name,
  ].filter(Boolean);
  const methodLabel = item.similarity_method
    ? String(item.similarity_method).replaceAll("_", " ").replace("cosine", "cosine match")
    : null;

  const content = (
    <>
      <div className={`relative ${isSimilar ? "bg-white p-3" : "bg-stone-100"}`}>
        {imageUrl && !imageFailed ? (
          <img
            alt={item.prod_name || fallbackLabel(item)}
            className={isSimilar ? "aspect-[4/5] w-full rounded-md bg-stone-100 object-contain" : "w-full object-cover"}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={imageUrl}
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-stone-200 via-sky-100 to-rose-100 p-4 text-center text-sm font-medium text-stone-600">
            {fallbackLabel(item)}
          </div>
        )}
        {item.rank && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-stone-950 shadow">
            #{item.rank}
          </span>
        )}
        {isSimilar && item.similarity_score !== undefined && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow">
            {formatScore(item.similarity_score)}
          </span>
        )}
      </div>
      <div className={isSimilar ? "space-y-3 px-4 pb-4 pt-1" : "space-y-3 p-3"}>
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className={isSimilar ? "clamp-2 text-base font-bold leading-5 text-stone-950" : "clamp-2 text-sm font-semibold leading-5 text-stone-950"}>
              {item.prod_name}
            </h3>
            {clickable && <ArrowUpRight aria-hidden="true" className="mt-0.5 shrink-0 text-stone-400" size={16} />}
          </div>
          <p className="mt-1 text-xs text-stone-500">{item.article_id}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[item.product_type_name, item.garment_group_name, item.colour_group_name].filter(Boolean).map((label) => (
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-700" key={label}>
              {label}
            </span>
          ))}
        </div>
        {(item.similarity_score !== undefined || item.score !== undefined || item.model_name) && (
          <div className={isSimilar ? "space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600" : "border-t border-stone-100 pt-3 text-xs text-stone-600"}>
            {item.similarity_score !== undefined && (
              <p>
                <span className="font-semibold text-stone-900">{scoreLabel}:</span> {formatScore(item.similarity_score)}
              </p>
            )}
            {item.score !== undefined && (
              <p>
                <span className="font-semibold text-stone-900">{scoreLabel}:</span> {formatScore(item.score)}
              </p>
            )}
            {showMethod && item.similarity_method && (
              <p className="break-words">
                <span className="font-semibold text-stone-900">Method:</span> {methodLabel}
              </p>
            )}
            {item.model_name && (
              <p className="mt-1 break-words">
                <span className="font-semibold text-stone-900">Model:</span> {item.model_name}
              </p>
            )}
            {isSimilar && item.similarity_score !== undefined && (
              <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-sky-700"
                  style={{ width: `${Math.max(8, Math.min(100, Number(item.similarity_score) * 100))}%` }}
                />
              </div>
            )}
          </div>
        )}
        {showWhy && (
          <div className="rounded-lg bg-emerald-50 p-2.5 text-xs leading-5 text-emerald-900">
            <div className="mb-1 flex items-center gap-1.5 font-bold">
              <Sparkles aria-hidden="true" size={14} />
              Why recommended
            </div>
            <p>
              Hybrid rank blends ALS taste similarity with global and recent popularity signals. This item matches{" "}
              {reasonParts.slice(0, 3).join(", ") || "the selected customer's feed pattern"}.
            </p>
          </div>
        )}
        {clickable && (
          <p className={isSimilar ? "inline-flex items-center gap-1 text-xs font-bold text-emerald-800" : "text-xs font-bold text-stone-700"}>
            {ctaLabel}
            {isSimilar && <ArrowUpRight aria-hidden="true" size={13} />}
          </p>
        )}
      </div>
    </>
  );

  const shellClass = isSimilar
    ? "block h-full w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-soft"
    : "mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-soft";

  if (!clickable) {
    return <article className={isSimilar ? shellClass : "mb-4 break-inside-avoid overflow-hidden rounded-lg border border-stone-200 bg-white"}>{content}</article>;
  }

  return (
    <button
      className={shellClass}
      onClick={() => onSelect(item.article_id)}
      type="button"
    >
      {content}
    </button>
  );
}

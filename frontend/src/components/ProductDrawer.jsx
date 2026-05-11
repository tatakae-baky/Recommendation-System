import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { api } from "../api/client.js";
import { formatScore } from "../utils/formatters.js";
import { fallbackLabel, getImageUrl } from "../utils/imageFallback.js";
import LoadingState from "./LoadingState.jsx";
import ProductGrid from "./ProductGrid.jsx";

const META_FIELDS = [
  ["Product type", "product_type_name"],
  ["Color", "colour_group_name"],
  ["Section", "section_name"],
  ["Department", "department_name"],
  ["Garment group", "garment_group_name"],
  ["Appearance", "graphical_appearance_name"],
];

const SOURCE_LABELS = {
  exported_forward: "Exported item-neighbor rows",
  reverse_lookup: "Reverse lookup from exported neighbors",
  metadata_fallback: "Metadata fallback",
};

export default function ProductDrawer({ articleId, onClose, onSelectSimilar }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!articleId) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [articleId]);

  useEffect(() => {
    if (!articleId) return;
    drawerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError("");
    setImageFailed(false);
    api
      .similarItems(articleId)
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  if (!articleId) return null;

  const item = data?.query_item;
  const similarItems = data?.similar_items ?? [];
  const imageUrl = getImageUrl(item);
  const sourceLabel = SOURCE_LABELS[data?.similarity_source] || "Similarity results";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" onClick={onClose} type="button" aria-label="Close product drawer" />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-6xl flex-col overflow-y-auto bg-[#f7f7f4] shadow-2xl ring-1 ring-black/10"
        ref={drawerRef}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Product detail</p>
            <h2 className="text-lg font-semibold text-stone-950">{item?.prod_name || articleId}</h2>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
          {loading || !item ? (
            <LoadingState label="drawer" />
          ) : (
            <>
              <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[minmax(260px,380px)_1fr]">
                <div className="overflow-hidden rounded-lg bg-stone-100">
                  {imageUrl && !imageFailed ? (
                    <img
                      alt={item.prod_name || fallbackLabel(item)}
                      className="max-h-[600px] w-full object-cover"
                      onError={() => setImageFailed(true)}
                      src={imageUrl}
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-stone-200 via-sky-100 to-rose-100 p-6 text-center font-semibold text-stone-600">
                      {fallbackLabel(item)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">{item.article_id}</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">{item.prod_name}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{item.detail_desc}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {META_FIELDS.map(([label, key]) => (
                      <div className="rounded-lg bg-stone-100 p-3" key={key}>
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-stone-950">{item[key] || "Unknown"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-950">How the next grid is produced</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Source: {sourceLabel}. The method is shown on each card, with scores such as{" "}
                      {formatScore(similarItems[0]?.similarity_score)} for the closest match.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ChevronRight aria-hidden="true" className="text-emerald-700" size={20} />
                  <h3 className="text-xl font-semibold text-stone-950">More like this</h3>
                </div>
                <ProductGrid
                  items={similarItems}
                  onSelect={(nextArticleId) => {
                    drawerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    onSelectSimilar?.(nextArticleId);
                  }}
                  ctaLabel="View match"
                  scoreLabel="Similarity"
                  showMethod
                  variant="similar"
                />
              </section>
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api/client.js";
import LoadingState from "../components/LoadingState.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatScore } from "../utils/formatters.js";
import { fallbackLabel, getImageUrl } from "../utils/imageFallback.js";

const META_FIELDS = [
  ["Product type", "product_type_name"],
  ["Color", "colour_group_name"],
  ["Section", "section_name"],
  ["Department", "department_name"],
  ["Garment group", "garment_group_name"],
  ["Appearance", "graphical_appearance_name"],
];

export default function ItemPage({ selectedArticleId, onItemSelect }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [articleId, setArticleId] = useState(selectedArticleId || "");
  const [data, setData] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      api
        .items({ q: query, limit: 300, inSimilarItems: true })
        .then((result) => {
          setItems(result.items);
          if (!articleId && result.items[0]) setArticleId(result.items[0].article_id);
        })
        .catch((err) => setError(err.message));
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [query, articleId]);

  useEffect(() => {
    if (selectedArticleId) setArticleId(selectedArticleId);
  }, [selectedArticleId]);

  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setImageFailed(false);
    api
      .similarItems(articleId)
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  const queryItem = data?.query_item;
  const similarItems = useMemo(() => data?.similar_items ?? [], [data]);
  const imageUrl = getImageUrl(queryItem);

  return (
    <div className="space-y-3">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-emerald-700">More like this</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Item similarity explorer
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Similar items" value={similarItems.length} tone="emerald" />
          <StatCard label="Top score" value={formatScore(similarItems[0]?.similarity_score)} tone="rose" />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_320px]">
          <label className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-stone-400" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search catalog"
              value={query}
            />
          </label>
          <select
            className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            onChange={(event) => setArticleId(event.target.value)}
            value={articleId}
          >
            {items.map((item) => (
              <option key={item.article_id} value={item.article_id}>
                {item.prod_name} - {item.article_id}
              </option>
            ))}
            {articleId && !items.some((item) => item.article_id === articleId) && (
              <option value={articleId}>Selected item - {articleId}</option>
            )}
          </select>
        </div>
      </section>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

      {loading || !queryItem ? (
        <LoadingState label="item page" />
      ) : (
        <>
          <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[minmax(280px,420px)_1fr]">
            <div className="overflow-hidden rounded-lg bg-stone-100">
              {imageUrl && !imageFailed ? (
                <img
                  alt={queryItem.prod_name || fallbackLabel(queryItem)}
                  className="h-full max-h-[620px] w-full object-cover"
                  onError={() => setImageFailed(true)}
                  src={imageUrl}
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-stone-200 via-sky-100 to-rose-100 p-6 text-center font-semibold text-stone-600">
                  {fallbackLabel(queryItem)}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">{queryItem.article_id}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">{queryItem.prod_name}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{queryItem.detail_desc}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {META_FIELDS.map(([label, key]) => (
                  <div className="rounded-lg bg-stone-100 p-3" key={key}>
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-950">{queryItem[key] || "Unknown"}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ProductGrid items={similarItems} onSelect={onItemSelect} scoreLabel="Similarity" showMethod />
        </>
      )}
    </div>
  );
}

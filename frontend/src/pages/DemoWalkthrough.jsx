import { useEffect, useMemo, useState } from "react";
import { BarChart3, Filter, Info, Search, ShoppingBag, Sparkles, UsersRound } from "lucide-react";
import { api } from "../api/client.js";
import CustomerSelector from "../components/CustomerSelector.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ProductDrawer from "../components/ProductDrawer.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

function topCounts(rows, field, limit = 5) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = row[field] || "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function uniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function StepCard({ number, title, body, icon: Icon }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-sm font-bold text-white">
          {number}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <Icon aria-hidden="true" className="text-emerald-700" size={17} />
            <h3 className="font-semibold text-stone-950">{title}</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
        </div>
      </div>
    </article>
  );
}

function TasteBars({ title, rows, tone = "emerald" }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  const barClass = tone === "rose" ? "bg-rose-700" : tone === "sky" ? "bg-sky-700" : "bg-emerald-700";

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="clamp-1 font-medium text-stone-700">{row.name}</span>
              <span className="text-stone-500">{row.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function DemoWalkthrough({ onOpenExplorer }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(null);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [garmentFilter, setGarmentFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [drawerArticleId, setDrawerArticleId] = useState("");

  useEffect(() => {
    api
      .customers()
      .then((rows) => {
        const eligible = rows.filter((customer) => customer.has_recommendations);
        setCustomers(eligible);
        setSelectedCustomerIdx(eligible[0]?.customer_idx ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (selectedCustomerIdx === null) return;
    setLoading(true);
    setSearch("");
    setGarmentFilter("all");
    setSectionFilter("all");
    api
      .recommendations(selectedCustomerIdx)
      .then((data) => {
        setFeed(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerIdx]);

  const recommendations = feed?.recommendations ?? [];
  const customer = feed?.customer;
  const garmentOptions = useMemo(() => uniqueValues(recommendations, "garment_group_name"), [recommendations]);
  const sectionOptions = useMemo(() => uniqueValues(recommendations, "section_name"), [recommendations]);
  const taste = useMemo(
    () => ({
      garments: topCounts(recommendations, "garment_group_name"),
      sections: topCounts(recommendations, "section_name"),
      colors: topCounts(recommendations, "colour_group_name"),
    }),
    [recommendations]
  );

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recommendations.filter((item) => {
      const matchesSearch =
        !query ||
        [item.prod_name, item.product_type_name, item.garment_group_name, item.section_name, item.colour_group_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesGarment = garmentFilter === "all" || item.garment_group_name === garmentFilter;
      const matchesSection = sectionFilter === "all" || item.section_name === sectionFilter;
      return matchesSearch && matchesGarment && matchesSection;
    });
  }, [recommendations, search, garmentFilter, sectionFilter]);

  const modelWeights = recommendations[0]
    ? [
        ["ALS taste", recommendations[0].als_weight],
        ["Global popularity", recommendations[0].global_weight],
        ["Recent popularity", recommendations[0].recent90_weight],
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-rose-700">Guided recommender walkthrough</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Start with a customer, explain the feed, inspect a product
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            pick a customer, read the recommendation signals, click a product,
            then use the model metrics as evidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Feed items" value={recommendations.length} tone="emerald" />
          <StatCard label="Model" value={feed?.model_name || "Loading"} tone="sky" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StepCard
          number="1"
          title="Choose customer"
          body="Use one exported home-feed customer so the recommendation grid has a clear subject."
          icon={UsersRound}
        />
        <StepCard
          number="2"
          title="Read taste pattern"
          body="Summarize the feed by garment group, section, and color before showing individual cards."
          icon={BarChart3}
        />
        <StepCard
          number="3"
          title="Explore feed"
          body="Filter the recommendations and explain that ranking comes from hybrid ALS plus popularity."
          icon={Filter}
        />
        <StepCard
          number="4"
          title="Click product"
          body="Open details and more-like-this results in context, without breaking the story."
          icon={ShoppingBag}
        />
      </section>

      {customers.length > 0 && (
        <CustomerSelector
          customers={customers}
          onChange={setSelectedCustomerIdx}
          selectedCustomerIdx={selectedCustomerIdx}
          title="Walkthrough customer"
        />
      )}

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

      {loading ? (
        <LoadingState label="demo walkthrough" />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <TasteBars rows={taste.garments} title="Garment groups in this feed" />
            <TasteBars rows={taste.sections} title="Sections in this feed" tone="sky" />
            <TasteBars rows={taste.colors} title="Colors in this feed" tone="rose" />
          </section>

          <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="text-emerald-700" size={18} />
                <h3 className="font-semibold text-stone-950">Recommendation logic</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                The exported final model is a hybrid. For the selected customer, products are ranked by ALS collaborative
                taste, global popularity, and recent popularity.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {modelWeights.map(([label, value]) => (
                  <div className="rounded-lg bg-stone-100 p-3" key={label}>
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-stone-950">{formatPercent(value, 0)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-sky-50 p-4">
              <div className="flex items-center gap-2">
                <Info aria-hidden="true" className="text-sky-800" size={18} />
                <h3 className="font-semibold text-sky-950">Similar-user note</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-sky-900">
                The current export uses one customer set for home-feed recommendations and another for similar-user examples.
                In this demo, similar users are kept as a separate explorer until both exports use the same customer IDs.
              </p>
              <button
                className="mt-4 inline-flex h-10 items-center rounded-lg bg-sky-800 px-4 text-sm font-semibold text-white hover:bg-sky-900"
                onClick={() => onOpenExplorer("user")}
                type="button"
              >
                Open similar-user explorer
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[1fr_240px_240px]">
              <label className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-stone-400" size={18} />
                <input
                  className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter by item, color, garment group, or section"
                  value={search}
                />
              </label>
              <select
                className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => setGarmentFilter(event.target.value)}
                value={garmentFilter}
              >
                <option value="all">All garment groups</option>
                {garmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => setSectionFilter(event.target.value)}
                value={sectionFilter}
              >
                <option value="all">All sections</option>
                {sectionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-stone-950">Personalized feed</h3>
                <p className="text-sm text-stone-600">
                  Showing {formatNumber(filteredRecommendations.length)} of {formatNumber(recommendations.length)} items
                  {customer ? ` for ${customer.display_name}` : ""}.
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                onClick={() => onOpenExplorer("metrics")}
                type="button"
              >
                Show model evidence
              </button>
            </div>

            <ProductGrid
              items={filteredRecommendations}
              onSelect={setDrawerArticleId}
              scoreLabel="Hybrid score"
              showWhy
            />
          </section>
        </>
      )}

      <ProductDrawer
        articleId={drawerArticleId}
        onClose={() => setDrawerArticleId("")}
        onSelectSimilar={(nextArticleId) => setDrawerArticleId(nextArticleId)}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { api } from "../api/client.js";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatNumber, formatPercent, humanizeKey } from "../utils/formatters.js";

const TABLE_METRICS = ["recall_at_k", "ndcg_at_k", "mrr_at_k", "map_at_k", "hitrate_at_k", "catalog_coverage"];

const METRIC_LABELS = {
  recall_at_k: "Recall@20",
  ndcg_at_k: "NDCG@20",
  mrr_at_k: "MRR@20",
  map_at_k: "MAP@20",
  hitrate_at_k: "HitRate@20",
  catalog_coverage: "Coverage",
};

function rowId(row, index) {
  return [
    row.model_name,
    row.eval_split,
    row.display_name,
    row.als_weight,
    row.global_weight,
    row.recent90_weight,
    row.recency_weight,
    row.n_eval_users,
    index,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join("__");
}

function modelLabel(row) {
  if (!row) return "Choose model";
  const split = row.eval_split ? ` (${row.eval_split})` : "";
  return `${row.display_name || row.model_name}${split}`;
}

function modelSubtitle(row) {
  if (!row) return "";
  const weights = [
    row.als_weight !== undefined ? `ALS ${formatNumber(row.als_weight)}` : null,
    row.global_weight !== undefined ? `Global ${formatNumber(row.global_weight)}` : null,
    row.recent90_weight !== undefined ? `Recent ${formatNumber(row.recent90_weight)}` : null,
    row.recency_weight ? `Recency ${formatNumber(row.recency_weight)}` : null,
  ].filter(Boolean);
  return weights.length ? weights.join(" / ") : row.model_family || row.source_label || "Evaluation row";
}

function metricDelta(challengerValue, baselineValue) {
  const challenger = Number(challengerValue);
  const baseline = Number(baselineValue);
  if (!Number.isFinite(challenger) || !Number.isFinite(baseline)) {
    return { absolute: null, relative: null };
  }
  return {
    absolute: challenger - baseline,
    relative: baseline !== 0 ? (challenger - baseline) / baseline : null,
  };
}

function formatPointDelta(value) {
  if (value === null || value === undefined) return "Not exported";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)} pp`;
}

function collectModelRows(metrics) {
  if (!metrics) return [];

  const sources = [
    ...(metrics.comparison_rows || []).map((row) => ({ ...row, source_label: "Final comparison" })),
    ...(metrics.final_hybrid_leaderboard || []).map((row) => ({ ...row, display_name: row.model_name, source_label: "Final leaderboard" })),
    ...(metrics.hybrid_tuning_leaderboard || []).map((row) => ({ ...row, display_name: row.model_name, source_label: "Hybrid tuning" })),
  ];

  const seen = new Set();
  return sources
    .filter((row) => row?.model_name)
    .map((row, index) => ({ ...row, _id: rowId(row, index) }))
    .filter((row) => {
      const key = [
        row.model_name,
        row.eval_split,
        row.als_weight,
        row.global_weight,
        row.recent90_weight,
        row.recency_weight,
        row.recall_at_k,
      ].join("__");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export default function ModelComparison() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [baselineId, setBaselineId] = useState("");
  const [challengerId, setChallengerId] = useState("");

  useEffect(() => {
    api
      .metrics()
      .then((data) => {
        setMetrics(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const modelRows = useMemo(() => collectModelRows(metrics), [metrics]);

  useEffect(() => {
    if (!modelRows.length) return;
    const popularity = modelRows.find((row) => row.model_name === "global_popularity");
    const finalValidation = modelRows.find(
      (row) => row.model_name === metrics?.best_model_name && row.eval_split === "validation"
    );
    const finalTest = modelRows.find((row) => row.model_name === metrics?.best_model_name && row.eval_split === "test");

    if (!baselineId) setBaselineId((popularity || modelRows[1] || modelRows[0])._id);
    if (!challengerId) setChallengerId((finalValidation || finalTest || modelRows[0])._id);
  }, [baselineId, challengerId, metrics?.best_model_name, modelRows]);

  const baseline = modelRows.find((row) => row._id === baselineId);
  const challenger = modelRows.find((row) => row._id === challengerId);

  if (loading) return <LoadingState label="model metrics" />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-emerald-700">Model comparison</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Hybrid ALS plus popularity wins the final selection
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label="Best model" value={metrics?.best_model_name} tone="emerald" />
          <StatCard label="Family" value={metrics?.final_model_family} tone="sky" />
        </div>
      </section>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Baseline model</span>
            <select
              className="h-12 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setBaselineId(event.target.value)}
              value={baselineId}
            >
              {modelRows.map((row) => (
                <option key={row._id} value={row._id}>
                  {modelLabel(row)}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500">{modelSubtitle(baseline)}</p>
          </label>

          <span className="hidden h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 lg:inline-flex">
            <ArrowRight aria-hidden="true" size={20} />
          </span>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Challenger model</span>
            <select
              className="h-12 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setChallengerId(event.target.value)}
              value={challengerId}
            >
              {modelRows.map((row) => (
                <option key={row._id} value={row._id}>
                  {modelLabel(row)}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500">{modelSubtitle(challenger)}</p>
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TABLE_METRICS.map((metric) => {
            const delta = metricDelta(challenger?.[metric], baseline?.[metric]);
            const winning = delta.absolute === null ? "unknown" : delta.absolute >= 0 ? "better" : "behind";
            return (
              <article
                className={`rounded-lg border p-4 ${
                  winning === "better"
                    ? "border-emerald-100 bg-emerald-50"
                    : winning === "behind"
                      ? "border-rose-100 bg-rose-50"
                      : "border-stone-200 bg-stone-50"
                }`}
                key={metric}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{METRIC_LABELS[metric]}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${
                      winning === "better" ? "bg-white text-emerald-800" : winning === "behind" ? "bg-white text-rose-800" : "bg-white text-stone-600"
                    }`}
                  >
                    {formatPointDelta(delta.absolute)}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-stone-950">{formatPercent(challenger?.[metric])}</p>
                <p className="mt-1 text-xs text-stone-600">Baseline: {formatPercent(baseline?.[metric])}</p>
                {delta.relative !== null && (
                  <p className="mt-3 text-xs font-semibold text-stone-700">
                    Relative change: {formatPercent(delta.relative, 1)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics?.featured_metrics?.map((metric) => (
          <MetricCard
            comparison={metric.popularity_value}
            key={metric.key}
            label={`Final ${metric.label}`}
            uplift={metric.uplift}
            value={metric.value}
          />
        ))}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Trophy aria-hidden="true" size={20} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-stone-500">Selection rule</p>
            <p className="mt-1 text-sm leading-6 text-stone-700">{metrics?.best_final_model_info?.selection_rule}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-100 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Split</th>
                <th className="px-4 py-3">Users</th>
                {TABLE_METRICS.map((metric) => (
                  <th className="px-4 py-3" key={metric}>
                    {humanizeKey(metric.replace("_at_k", "@20"))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {modelRows.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-950">{row.display_name}</p>
                    <p className="text-xs text-stone-500">{row.model_name}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{row.source_label}</td>
                  <td className="px-4 py-3 text-stone-700">{row.eval_split}</td>
                  <td className="px-4 py-3 text-stone-700">{formatNumber(row.n_eval_users)}</td>
                  {TABLE_METRICS.map((metric) => (
                    <td className="px-4 py-3 font-medium text-stone-800" key={metric}>
                      {formatPercent(row[metric])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

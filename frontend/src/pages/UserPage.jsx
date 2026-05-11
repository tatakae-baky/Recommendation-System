import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import CustomerSelector from "../components/CustomerSelector.jsx";
import LoadingState from "../components/LoadingState.jsx";
import SimilarUserCard from "../components/SimilarUserCard.jsx";
import StatCard from "../components/StatCard.jsx";
import { compactId, formatScore, splitPipedList } from "../utils/formatters.js";

export default function UserPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(null);
  const [similarData, setSimilarData] = useState(null);
  const [tasteData, setTasteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .customers()
      .then((rows) => {
        const eligible = rows.filter((customer) => customer.has_similar_users);
        setCustomers(eligible);
        setSelectedCustomerIdx(eligible[0]?.customer_idx ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (selectedCustomerIdx === null) return;
    setLoading(true);
    Promise.all([api.similarUsers(selectedCustomerIdx), api.tasteSummary(selectedCustomerIdx)])
      .then(([similar, taste]) => {
        setSimilarData(similar);
        setTasteData(taste);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerIdx]);

  const tasteByUser = useMemo(() => {
    const rows = tasteData?.taste_summary ?? [];
    return Object.fromEntries(rows.map((row) => [row.similar_customer_idx, row]));
  }, [tasteData]);

  const similarUsers = similarData?.similar_users ?? [];
  const firstTaste = tasteData?.taste_summary?.[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-sky-700">Taste neighbors</p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
            Similar users and shared fashion taste
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Similar users" value={similarUsers.length} tone="sky" />
          <StatCard label="Top similarity" value={formatScore(similarUsers[0]?.similarity_score)} tone="emerald" />
        </div>
      </section>

      {customers.length > 0 && (
        <CustomerSelector
          customers={customers}
          onChange={setSelectedCustomerIdx}
          selectedCustomerIdx={selectedCustomerIdx}
          title="Similarity customer"
        />
      )}

      {firstTaste && (
        <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-stone-800">Selected customer's top garment groups</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {splitPipedList(firstTaste.query_top_garment_groups).map((item) => (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-800" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">Selected customer's top sections</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {splitPipedList(firstTaste.query_top_sections).map((item) => (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading ? (
        <LoadingState label="similar users" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {similarUsers.map((user) => (
            <SimilarUserCard key={user.similar_customer_idx} taste={tasteByUser[user.similar_customer_idx]} user={user} />
          ))}
        </div>
      )}

      {!loading && tasteData?.taste_summary?.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-100 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Neighbor</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Garment overlap</th>
                  <th className="px-4 py-3">Section overlap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tasteData.taste_summary.map((row) => (
                  <tr key={`${row.query_customer_idx}-${row.similar_customer_idx}`}>
                    <td className="px-4 py-3 font-semibold text-stone-950">{compactId(row.similar_customer_idx)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatScore(row.similarity_score)}</td>
                    <td className="px-4 py-3 text-stone-700">{row.common_garment_groups || "None exported"}</td>
                    <td className="px-4 py-3 text-stone-700">{row.common_sections || "None exported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

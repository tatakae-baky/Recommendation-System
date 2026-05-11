import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import CustomerSelector from "../components/CustomerSelector.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import StatCard from "../components/StatCard.jsx";

export default function HomeFeed({ onItemSelect }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(null);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    api
      .recommendations(selectedCustomerIdx)
      .then((data) => {
        setFeed(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerIdx]);

  const recommendations = useMemo(() => feed?.recommendations ?? [], [feed]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">Personalized hybrid feed</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Product recommendations for a demo customer
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Returned items" value={recommendations.length} tone="emerald" />
          <StatCard label="Model" value={feed?.model_name || "Loading"} tone="sky" />
        </div>
      </section>

      {customers.length > 0 && (
        <CustomerSelector
          customers={customers}
          onChange={setSelectedCustomerIdx}
          selectedCustomerIdx={selectedCustomerIdx}
          title="Customer"
        />
      )}

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading ? <LoadingState label="home feed" /> : <ProductGrid items={recommendations} onSelect={onItemSelect} />}
    </div>
  );
}

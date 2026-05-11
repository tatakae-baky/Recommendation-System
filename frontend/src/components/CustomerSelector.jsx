import { formatNumber } from "../utils/formatters.js";

export default function CustomerSelector({ customers, selectedCustomerIdx, onChange, title }) {
  const selected = customers.find((customer) => Number(customer.customer_idx) === Number(selectedCustomerIdx));

  return (
    <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-soft lg:grid-cols-[minmax(280px,360px)_1fr]">
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-800" htmlFor="customer-selector">
          {title}
        </label>
        <select
          className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="customer-selector"
          onChange={(event) => onChange(Number(event.target.value))}
          value={selectedCustomerIdx ?? ""}
        >
          {customers.map((customer) => (
            <option key={customer.customer_idx} value={customer.customer_idx}>
              {customer.display_name || `Customer ${customer.customer_idx}`}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-100 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Customer idx</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">{selected.customer_idx}</p>
          </div>
          <div className="rounded-lg bg-stone-100 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Train events</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">{formatNumber(selected.train_purchase_events)}</p>
          </div>
          <div className="rounded-lg bg-stone-100 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Unique items</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">{formatNumber(selected.train_unique_items)}</p>
          </div>
        </div>
      )}
    </section>
  );
}

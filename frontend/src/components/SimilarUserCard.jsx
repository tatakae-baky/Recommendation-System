import { compactId, formatScore, splitPipedList } from "../utils/formatters.js";

function ChipList({ values }) {
  if (!values.length) return <span className="text-sm text-stone-500">No overlap exported</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

export default function SimilarUserCard({ user, taste }) {
  const garmentGroups = splitPipedList(taste?.common_garment_groups);
  const sections = splitPipedList(taste?.common_sections);

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Similar customer</p>
          <h3 className="mt-1 text-lg font-semibold text-stone-950">{compactId(user.similar_customer_idx)}</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {formatScore(user.similarity_score)}
        </span>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-800">Common garment groups</p>
          <ChipList values={garmentGroups} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-800">Common sections</p>
          <ChipList values={sections} />
        </div>
      </div>
    </article>
  );
}

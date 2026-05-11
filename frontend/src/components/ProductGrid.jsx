import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({
  items,
  onSelect,
  scoreLabel,
  showMethod = false,
  showWhy = false,
  ctaLabel,
  variant = "default",
}) {
  if (!items?.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
        No products found.
      </div>
    );
  }

  return (
    <div className={variant === "similar" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5"}>
      {items.map((item) => (
        <ProductCard
          item={item}
          key={`${item.article_id}-${item.rank ?? "item"}`}
          onSelect={onSelect}
          scoreLabel={scoreLabel}
          showMethod={showMethod}
          showWhy={showWhy}
          ctaLabel={ctaLabel}
          variant={variant}
        />
      ))}
    </div>
  );
}

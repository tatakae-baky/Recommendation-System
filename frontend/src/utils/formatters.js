export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "Not exported";
  if (typeof value === "number") return new Intl.NumberFormat("en").format(value);
  return value;
}

export function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "Not exported";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${(numeric * 100).toFixed(digits)}%`;
}

export function formatScore(value, digits = 3) {
  if (value === null || value === undefined || value === "") return "Not exported";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return numeric.toFixed(digits);
}

export function compactId(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
}

export function splitPipedList(value) {
  if (!value) return [];
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function humanizeKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

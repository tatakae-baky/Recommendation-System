const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export const api = {
  health: () => request("/health"),
  customers: () => request("/customers"),
  recommendations: (customerIdx) => request(`/recommendations/${customerIdx}`),
  items: ({ q = "", limit = 250, offset = 0, inHomeFeed, inSimilarItems } = {}) => {
    const params = new URLSearchParams({ limit, offset });
    if (q) params.set("q", q);
    if (typeof inHomeFeed === "boolean") params.set("in_home_feed", inHomeFeed);
    if (typeof inSimilarItems === "boolean") params.set("in_similar_items", inSimilarItems);
    return request(`/items?${params.toString()}`);
  },
  item: (articleId) => request(`/items/${articleId}`),
  similarItems: (articleId) => request(`/items/${articleId}/similar`),
  similarUsers: (customerIdx) => request(`/users/${customerIdx}/similar`),
  tasteSummary: (customerIdx) => request(`/users/${customerIdx}/taste-summary`),
  metrics: () => request("/metrics"),
};

export { API_BASE_URL };

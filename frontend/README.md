# H&M Fashion Recommender Demo Frontend

React + Tailwind CSS frontend for the H&M recommender portfolio demo.

## Run

```bash
npm install
npm run dev
```

By default the app expects the FastAPI backend at `http://127.0.0.1:8000`. To point at another backend:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Images are served directly from `frontend/public/images`, so item image paths such as `/images/070/0706016001.jpg` work without a separate image API.

## Demo Flow

The first tab is the guided `Demo` page. It is designed for a live explanation:

1. Pick a customer.
2. Explain the derived taste pattern.
3. Filter the recommendation feed.
4. Open a product drawer.
5. Show similar products.
6. Use `Models` as supporting evidence.

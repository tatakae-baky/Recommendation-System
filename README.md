# H&M Fashion Recommender Demo

A portfolio-ready web demo for an H&M fashion recommender system. The backend serves exported demo data from the completed notebooks, and the frontend presents a Pinterest-style product recommendation experience with item similarity, similar users, and model comparison.

## Project Structure

```text
hm-fashion-recommender-demo/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── data_loader.py
│   │   ├── routes/
│   │   ├── services/
│   │   └── schemas/
│   ├── data/
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/images/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── styles/
│   ├── package.json
│   └── README.md
└── README.md
```

## Run Backend

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:8000`.
This uses the local virtual environment at `backend/.venv`.

If dependencies ever need reinstalling:

```bash
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run Frontend

```bash
cd frontend
npm run dev
```

The React app runs at `http://localhost:5173`.

## Demo Pages

- Demo: guided walkthrough for a viva or portfolio presentation. Select a customer, inspect taste patterns, filter recommendations, open a product drawer, and view more-like-this items.
- Item Explorer: inspect any product and view ALS item-embedding neighbors.
- Similar Users: view customer-neighbor similarity and shared taste summaries.
- Model Comparison: compare hybrid, popularity, and final evaluation metrics.

## Recommended Demo Flow

1. Start on `Demo` and select a customer.
2. Explain the customer-level recommendation pattern using garment group, section, and color summaries.
3. Use the filters to show the feed is interactive.
4. Click a product card to open the product drawer.
5. Use `More like this` to show item similarity.
6. Move to `Models` to prove the hybrid model beats the popularity baseline.

The similar-user export currently uses a different customer-index set from the home-feed export, so the app presents it as a separate explorer instead of pretending it belongs to the selected home-feed customer.

## Backend API

- `GET /health`
- `GET /customers`
- `GET /recommendations/{customer_idx}`
- `GET /items`
- `GET /items/{article_id}`
- `GET /items/{article_id}/similar`
- `GET /users/{customer_idx}/similar`
- `GET /users/{customer_idx}/taste-summary`
- `GET /metrics`

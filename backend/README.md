# H&M Fashion Recommender Demo API

FastAPI backend for the portfolio demo. It reads the exported demo artifacts from `backend/data/` and serves recommendation, item similarity, user similarity, and model metric endpoints.

## Run

```bash
npm run dev
```

The API runs at `http://localhost:8000` by default.
This command uses `backend/.venv`.

If dependencies ever need reinstalling:

```bash
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

For auto-reload during backend editing:

```bash
npm run dev:reload
```

## Endpoints

- `GET /health`
- `GET /customers`
- `GET /recommendations/{customer_idx}`
- `GET /items`
- `GET /items/{article_id}`
- `GET /items/{article_id}/similar`
- `GET /users/{customer_idx}/similar`
- `GET /users/{customer_idx}/taste-summary`
- `GET /metrics`

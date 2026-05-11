import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import get_settings


TABLE_FILES = {
    "articles": "demo_articles",
    "customers": "demo_customers",
    "home_feed": "demo_home_feed",
    "similar_items": "demo_similar_items",
    "similar_users": "demo_similar_users",
    "taste_summary": "demo_similar_user_taste_summary",
}

JSON_FILES = {
    "metrics": "demo_model_metrics.json",
    "frontend_config": "frontend_config.json",
}

STRING_ID_FIELDS = {
    "article_id",
    "query_article_id",
    "similar_article_id",
    "customer_id",
    "image_url",
    "query_image_url",
    "similar_image_url",
    "image_relative_path",
}


def _clean_scalar(key: str, value: Any) -> Any:
    if value == "" or value is None:
        return None
    if not isinstance(value, str):
        return value

    stripped = value.strip()
    if stripped == "":
        return None
    if key in STRING_ID_FIELDS or key.endswith("_name") or key.endswith("_desc"):
        return stripped
    if stripped.lower() == "true":
        return True
    if stripped.lower() == "false":
        return False

    try:
        if "." not in stripped and "e" not in stripped.lower():
            return int(stripped)
        return float(stripped)
    except ValueError:
        return stripped


def _clean_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: _clean_scalar(key, value) for key, value in row.items()}


def _read_csv(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return [_clean_row(row) for row in csv.DictReader(file)]


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _read_parquet(path: Path) -> list[dict[str, Any]]:
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError(
            f"Parquet file {path.name} exists, but pandas/pyarrow is not installed. "
            "Install backend requirements or provide the CSV export."
        ) from exc

    return pd.read_parquet(path).where(lambda df: df.notna(), None).to_dict("records")


def _resolve_table_path(stem: str) -> Path:
    data_dir = get_settings().data_dir
    for suffix in (".csv", ".json", ".parquet"):
        candidate = data_dir / f"{stem}{suffix}"
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No data file found for {stem} in {data_dir}")


@lru_cache(maxsize=None)
def load_table(table_name: str) -> list[dict[str, Any]]:
    if table_name not in TABLE_FILES:
        raise KeyError(f"Unknown table: {table_name}")

    path = _resolve_table_path(TABLE_FILES[table_name])
    if path.suffix == ".csv":
        return _read_csv(path)
    if path.suffix == ".json":
        data = _read_json(path)
        return [_clean_row(row) for row in data]
    if path.suffix == ".parquet":
        return [_clean_row(row) for row in _read_parquet(path)]
    raise ValueError(f"Unsupported table format: {path}")


@lru_cache(maxsize=None)
def load_json(file_name: str) -> dict[str, Any]:
    if file_name not in JSON_FILES:
        raise KeyError(f"Unknown JSON export: {file_name}")

    path = get_settings().data_dir / JSON_FILES[file_name]
    if not path.exists():
        raise FileNotFoundError(f"No JSON file found at {path}")
    return _read_json(path)


def data_file_status() -> dict[str, Any]:
    data_dir = get_settings().data_dir
    tables = {}
    for table_name, stem in TABLE_FILES.items():
        try:
            path = _resolve_table_path(stem)
            tables[table_name] = {"file": path.name, "rows": len(load_table(table_name))}
        except FileNotFoundError:
            tables[table_name] = {"file": None, "rows": 0}

    json_files = {}
    for file_name, export_name in JSON_FILES.items():
        path = data_dir / export_name
        json_files[file_name] = {"file": export_name, "exists": path.exists()}

    return {"data_dir": str(data_dir), "tables": tables, "json_files": json_files}

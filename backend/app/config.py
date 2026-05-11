import os
from functools import lru_cache
from pathlib import Path


class Settings:
    app_name: str = "H&M Fashion Recommender Demo API"
    app_version: str = "1.0.0"
    data_dir: Path = Path(__file__).resolve().parents[1] / "data"

    @property
    def cors_origins(self) -> list[str]:
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        extra = os.environ.get("CORS_ORIGINS", "")
        extra_origins = [o.strip() for o in extra.split(",") if o.strip()]
        return defaults + extra_origins


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

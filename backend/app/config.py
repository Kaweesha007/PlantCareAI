from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:4173,"
    "http://127.0.0.1:4173"
)


def _parse_cors_origins(raw_origins: str) -> tuple[str, ...]:
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return tuple(origins)


def _resolve_project_path(raw_path: str) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate
    return (PROJECT_ROOT / candidate).resolve()


def _parse_positive_int(env_name: str, default: int) -> int:
    raw_value = os.getenv(env_name)
    if raw_value is None:
        return default
    try:
        parsed = int(raw_value)
        return parsed if parsed > 0 else default
    except ValueError:
        return default


def _parse_unit_float(env_name: str, default: float) -> float:
    raw_value = os.getenv(env_name)
    if raw_value is None:
        return default
    try:
        parsed = float(raw_value)
        return parsed if 0.0 <= parsed <= 1.0 else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables and defaults."""

    app_name: str
    app_version: str
    environment: str
    api_prefix: str
    cors_origins: tuple[str, ...]
    max_image_size_bytes: int
    allowed_extensions: tuple[str, ...]
    allowed_mime_types: tuple[str, ...]
    allowed_image_formats: tuple[str, ...]
    image_input_size: tuple[int, int]
    model_path: Path
    labels_path: Path
    gatekeeper_model_path: Path
    gatekeeper_labels_path: Path
    treatment_database_path: Path
    confidence_threshold: float
    gatekeeper_threshold: float
    top_k_alternatives: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    max_size_mb = _parse_positive_int("MAX_IMAGE_SIZE_MB", 5)
    input_dim = _parse_positive_int("IMAGE_INPUT_SIZE", 224)

    raw_model_path = os.getenv(
        "MODEL_PATH",
        "ai-model/trained_model/plant_disease_model.keras",
    )
    raw_labels_path = os.getenv(
        "LABELS_PATH",
        "ai-model/trained_model/class_names.json",
    )
    raw_gatekeeper_model_path = os.getenv(
        "GATEKEEPER_MODEL_PATH",
        "ai-model/trained_model/plant_gatekeeper_model.keras",
    )
    raw_gatekeeper_labels_path = os.getenv(
        "GATEKEEPER_LABELS_PATH",
        "ai-model/trained_model/gatekeeper_class_names.json",
    )
    raw_treatment_database_path = os.getenv(
        "TREATMENT_DATABASE_PATH",
        str(BACKEND_DIR / "app" / "data" / "treatment_database.json"),
    )

    return Settings(
        app_name=os.getenv("APP_NAME", "PlantCare AI Backend"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        environment=os.getenv("ENVIRONMENT", "development"),
        api_prefix="/api",
        cors_origins=_parse_cors_origins(
            os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
        ),
        max_image_size_bytes=max_size_mb * 1024 * 1024,
        allowed_extensions=(".jpg", ".jpeg", ".png"),
        allowed_mime_types=("image/jpeg", "image/jpg", "image/png"),
        allowed_image_formats=("JPEG", "PNG"),
        image_input_size=(input_dim, input_dim),
        model_path=_resolve_project_path(raw_model_path),
        labels_path=_resolve_project_path(raw_labels_path),
        gatekeeper_model_path=_resolve_project_path(raw_gatekeeper_model_path),
        gatekeeper_labels_path=_resolve_project_path(raw_gatekeeper_labels_path),
        treatment_database_path=_resolve_project_path(raw_treatment_database_path),
        confidence_threshold=_parse_unit_float("CONFIDENCE_THRESHOLD", 0.60),
        gatekeeper_threshold=_parse_unit_float("GATEKEEPER_THRESHOLD", 0.65),
        top_k_alternatives=_parse_positive_int("TOP_K_ALTERNATIVES", 3),
    )

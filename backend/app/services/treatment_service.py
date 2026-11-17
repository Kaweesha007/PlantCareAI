from functools import lru_cache
import json
import logging
from pathlib import Path
import re
from typing import Any, Dict, List, Optional

from app.config import Settings, get_settings
from app.schemas.treatment_schema import (
    TreatmentCategoriesResponse,
    TreatmentCategoryItem,
    TreatmentRecommendation,
)

logger = logging.getLogger(__name__)


class TreatmentNotFoundError(Exception):
    """Raised when recommendations for a requested disease identifier are not found."""

    def __init__(self, disease_id: str, available_classes: Optional[List[str]] = None) -> None:
        self.disease_id = disease_id
        self.available_classes = available_classes or []
        self.code = "TREATMENT_NOT_FOUND"
        self.status_code = 404
        super().__init__(
            f"Treatment recommendations not found for condition '{disease_id}'. "
            f"Supported conditions include: {', '.join(sorted(self.available_classes)[:6])}..."
        )


def _normalize_identifier(identifier: str) -> str:
    """Normalize input strings by removing special characters and lowering case."""
    return re.sub(r"[^a-z0-9]", "", identifier.lower().strip())


class TreatmentService:
    """Service to load, index, and query the agronomic treatment database."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self._classes_raw: Dict[str, Dict[str, Any]] = {}
        self._parsed_cache: Dict[str, TreatmentRecommendation] = {}
        self._index: Dict[str, str] = {}
        self._metadata: Dict[str, Any] = {}
        self.load_database()

    def load_database(self) -> bool:
        """Load and index the JSON database from disk."""
        if not self.database_path.exists() or not self.database_path.is_file():
            logger.warning("Treatment database not found at '%s'", self.database_path)
            return False

        try:
            with open(self.database_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self._metadata = data.get("metadata", {})
            self._classes_raw = data.get("classes", {})
            self._parsed_cache = {}
            self._index = {}

            for class_label, entry in self._classes_raw.items():
                parsed = TreatmentRecommendation(**entry)
                self._parsed_cache[class_label] = parsed

                # Index primary label
                self._index[class_label] = class_label
                self._index[class_label.lower()] = class_label

                # Index slug variations (e.g. Tomato_Early_blight -> tomato-early-blight)
                slug = re.sub(r"[^a-zA-Z0-9]+", "-", class_label).strip("-").lower()
                self._index[slug] = class_label

                # Index alphanumeric normalized string
                norm = _normalize_identifier(class_label)
                if norm:
                    self._index[norm] = class_label

                # Index disease name
                d_name = entry.get("disease_name", "")
                if d_name:
                    d_slug = re.sub(r"[^a-zA-Z0-9]+", "-", d_name).strip("-").lower()
                    self._index[d_slug] = class_label
                    self._index[_normalize_identifier(d_name)] = class_label

            logger.info(
                "Loaded treatment database from '%s' with %d classes and %d search index keys.",
                self.database_path,
                len(self._parsed_cache),
                len(self._index),
            )
            return True
        except Exception as exc:
            logger.exception("Failed to load treatment database from '%s': %s", self.database_path, exc)
            return False

    @property
    def is_loaded(self) -> bool:
        return len(self._parsed_cache) > 0

    @property
    def available_class_labels(self) -> List[str]:
        return list(self._classes_raw.keys())

    def get_by_class_label(self, class_label: str) -> Optional[TreatmentRecommendation]:
        """Direct retrieval by exact class label for model integration."""
        return self._parsed_cache.get(class_label)

    def get_treatment_by_disease(self, disease_id: str) -> TreatmentRecommendation:
        """Lookup treatment recommendation by class label, slug, or normalized identifier."""
        cleaned = disease_id.strip()
        matched_label = (
            self._index.get(cleaned)
            or self._index.get(cleaned.lower())
            or self._index.get(_normalize_identifier(cleaned))
        )

        if not matched_label or matched_label not in self._parsed_cache:
            raise TreatmentNotFoundError(disease_id, available_classes=self.available_class_labels)

        return self._parsed_cache[matched_label]

    def get_all_treatments(
        self,
        *,
        crop: Optional[str] = None,
        category: Optional[str] = None,
        condition_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[TreatmentRecommendation]:
        """Query treatment recommendations with optional filtering."""
        results: List[TreatmentRecommendation] = []
        clean_crop = crop.strip().lower() if isinstance(crop, str) and crop.strip() else None
        clean_category = category.strip().lower() if isinstance(category, str) and category.strip() else None
        clean_cond_type = condition_type.strip().lower() if isinstance(condition_type, str) and condition_type.strip() else None
        clean_search = search.strip().lower() if isinstance(search, str) and search.strip() else None

        for item in self._parsed_cache.values():
            if clean_crop and clean_crop not in item.crop.lower():
                continue
            if clean_category and clean_category != item.pathogen_type.lower():
                continue
            if clean_cond_type and clean_cond_type != item.condition_type.lower():
                continue
            if clean_search:
                searchable = f"{item.disease_name} {item.crop} {item.scientific_name} {item.short_description}".lower()
                if clean_search not in searchable:
                    continue

            results.append(item)

        return results

    def get_categories(self) -> TreatmentCategoriesResponse:
        """Summarize treatment categories, conditions per category, and covered crops."""
        CATEGORY_METADATA = {
            "Fungal": {
                "id": "fungal",
                "name": "Fungal Diseases",
                "description": "Foliar and fruit infections caused by fungal pathogens (e.g., Early Blight, Septoria, Leaf Mold).",
            },
            "Oomycete": {
                "id": "oomycete",
                "name": "Oomycete Blights",
                "description": "Rapid water-borne blights caused by Phytophthora species (e.g., Potato and Tomato Late Blight).",
            },
            "Bacterial": {
                "id": "bacterial",
                "name": "Bacterial Diseases",
                "description": "Infections caused by plant-pathogenic bacteria, managed primarily via sanitation and protectant copper.",
            },
            "Viral": {
                "id": "viral",
                "name": "Viral Infections",
                "description": "Systemic plant viruses (ToMV, TYLCV) requiring vector control and nursery hygiene (no chemical cure).",
            },
            "Arachnid Pest": {
                "id": "pest",
                "name": "Pest & Mite Infestations",
                "description": "Crop damage caused by sap-feeding arachnid pests (e.g., Two-Spotted Spider Mites).",
            },
            "None": {
                "id": "healthy",
                "name": "Healthy Baseline Maintenance",
                "description": "General plant nutrition, irrigation hygiene, and preventive care for disease-free crops.",
            },
        }

        category_counts: Dict[str, int] = {}
        crops_set: set[str] = set()

        for item in self._parsed_cache.values():
            cat = item.pathogen_type or "None"
            category_counts[cat] = category_counts.get(cat, 0) + 1
            crops_set.add(item.crop)

        category_items: List[TreatmentCategoryItem] = []
        for cat_name, meta in CATEGORY_METADATA.items():
            count = category_counts.get(cat_name, 0)
            if count > 0:
                category_items.append(
                    TreatmentCategoryItem(
                        id=meta["id"],
                        name=meta["name"],
                        description=meta["description"],
                        condition_count=count,
                    )
                )

        return TreatmentCategoriesResponse(
            categories=category_items,
            crops=sorted(list(crops_set)),
            total_conditions=len(self._parsed_cache),
        )


@lru_cache(maxsize=1)
def get_treatment_service() -> TreatmentService:
    """Return a cached singleton instance of TreatmentService."""
    settings = get_settings()
    return TreatmentService(database_path=settings.treatment_database_path)

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.prediction_schema import ErrorResponse
from app.schemas.treatment_schema import (
    TreatmentCategoriesResponse,
    TreatmentListResponse,
    TreatmentRecommendation,
)
from app.services.treatment_service import TreatmentNotFoundError, TreatmentService, get_treatment_service

router = APIRouter(prefix="/api/treatments", tags=["Agronomic Treatment Recommendations"])


@router.get(
    "/categories",
    response_model=TreatmentCategoriesResponse,
    summary="Retrieve available treatment and pathogen categories",
    description="Returns categorized groupings (Fungal, Bacterial, Viral, Oomycete, Pest, Healthy) along with crop coverage and condition counts.",
)
def get_treatment_categories(
    service: TreatmentService = Depends(get_treatment_service),
) -> TreatmentCategoriesResponse:
    """Return available treatment categories and condition counts."""
    return service.get_categories()


@router.get(
    "",
    response_model=TreatmentListResponse,
    summary="List all verified disease treatments and general care guides",
    description="Query agronomic recommendations with optional filters by crop, pathogen category, condition type, or text search.",
)
def list_treatments(
    crop: Optional[str] = Query(
        None,
        description="Filter by crop name (e.g. 'Tomato', 'Potato', 'Bell Pepper')",
        examples=["Tomato"],
    ),
    category: Optional[str] = Query(
        None,
        description="Filter by pathogen category (e.g. 'Fungal', 'Bacterial', 'Viral', 'Oomycete', 'Arachnid Pest', 'None')",
        examples=["Fungal"],
    ),
    condition_type: Optional[str] = Query(
        None,
        description="Filter by condition type ('disease' or 'healthy')",
        examples=["disease"],
    ),
    search: Optional[str] = Query(
        None,
        description="Free-text search across disease name, symptoms, and pathogen",
        examples=["blight"],
    ),
    service: TreatmentService = Depends(get_treatment_service),
) -> TreatmentListResponse:
    """Retrieve filtered treatment recommendations."""
    crop_val = crop if isinstance(crop, str) else None
    cat_val = category if isinstance(category, str) else None
    cond_val = condition_type if isinstance(condition_type, str) else None
    search_val = search if isinstance(search, str) else None

    items = service.get_all_treatments(
        crop=crop_val,
        category=cat_val,
        condition_type=cond_val,
        search=search_val,
    )
    return TreatmentListResponse(total=len(items), items=items)


@router.get(
    "/{disease_id}",
    response_model=TreatmentRecommendation,
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Disease or condition identifier not found in the treatment database",
        }
    },
    summary="Retrieve comprehensive treatment recommendation for a specific disease",
    description="Fetch structured treatment guidance by model classification label (e.g. 'Tomato_Early_blight') or URL slug (e.g. 'tomato-early-blight').",
)
def get_treatment_by_disease(
    disease_id: str,
    service: TreatmentService = Depends(get_treatment_service),
) -> TreatmentRecommendation:
    """Retrieve recommendation for a specific disease identifier."""
    try:
        return service.get_treatment_by_disease(disease_id)
    except TreatmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile

from app.config import Settings, get_settings
from app.schemas.prediction_schema import (
    ErrorResponse,
    HealthResponse,
    PredictionResponse,
)
from app.services.image_processor import validate_and_preprocess_upload
from app.services.predictor import LeafDiseasePredictor, get_predictor

router = APIRouter(prefix="/api", tags=["PlantCare Prediction"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check PlantCare AI API and model readiness",
)
async def health_check(
    settings: Settings = Depends(get_settings),
    predictor: LeafDiseasePredictor = Depends(get_predictor),
) -> HealthResponse:
    """Return service health along with model, label, and threshold readiness."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        model_ready=predictor.is_ready,
        gatekeeper_ready=predictor.is_gatekeeper_ready,
        model_path=str(settings.model_path),
        labels_path=str(settings.labels_path),
        class_count=predictor.class_count,
        confidence_threshold=settings.confidence_threshold,
        message=predictor.status_message,
        timestamp=datetime.now(timezone.utc),
    )


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or corrupted image upload"},
        413: {"model": ErrorResponse, "description": "Image exceeds maximum allowed size"},
        422: {"model": ErrorResponse, "description": "Missing multipart file field"},
        503: {"model": ErrorResponse, "description": "Trained AI model not available yet"},
        500: {"model": ErrorResponse, "description": "Unexpected prediction server error"},
    },
    summary="Validate a leaf image and run plant disease prediction",
)
async def predict_leaf_disease(
    file: UploadFile = File(
        ...,
        description="Plant leaf photograph in JPG, JPEG, or PNG format (max 5 MB).",
    ),
    settings: Settings = Depends(get_settings),
    predictor: LeafDiseasePredictor = Depends(get_predictor),
) -> PredictionResponse:
    """Validate and preprocess the uploaded leaf image, then delegate to the predictor."""
    preprocessed_image = await validate_and_preprocess_upload(file, settings)
    return predictor.predict(preprocessed_image)

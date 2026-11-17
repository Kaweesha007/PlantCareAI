from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.treatment_schema import TreatmentRecommendation


class HealthResponse(BaseModel):
    """Structured response returned by GET /api/health."""

    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["PlantCare AI Backend"])
    version: str = Field(..., examples=["0.1.0"])
    model_ready: bool = Field(..., description="Whether the trained AI model is loaded.")
    gatekeeper_ready: bool = Field(default=False, description="Whether the plant gatekeeper model is loaded.")
    model_path: str = Field(..., description="Configured filesystem path for model weights.")
    labels_path: str = Field(..., description="Configured filesystem path for class names.")
    class_count: int = Field(default=0, ge=0, description="Number of loaded output classes.")
    confidence_threshold: float = Field(
        ..., ge=0.0, le=1.0, description="Minimum confidence required for a confirmed diagnosis."
    )
    message: str = Field(..., description="Human-readable readiness summary.")
    timestamp: datetime


class ImageMetadata(BaseModel):
    """Metadata extracted during leaf image validation and preprocessing."""

    filename: str
    content_type: str
    format: str
    size_bytes: int
    original_width: int
    original_height: int
    processed_size: list[int]


class AlternativePrediction(BaseModel):
    """Candidate class probability returned alongside the primary prediction."""

    class_label: str
    plant_name: str
    disease_name: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class PredictionResponse(BaseModel):
    """Structured diagnostic payload returned by POST /api/predict."""

    status: Literal["confirmed", "uncertain", "unsupported"] = Field(default="confirmed")
    is_supported: bool = Field(default=True, description="Whether the leaf belongs to a supported crop (Tomato, Potato, Bell Pepper).")
    is_uncertain: bool = Field(default=False)
    class_label: Optional[str] = None
    disease_name: str
    plant_name: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    confidence_threshold: float = Field(..., ge=0.0, le=1.0)
    message: Optional[str] = None
    top_alternatives: list[AlternativePrediction] = Field(default_factory=list)
    severity: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    causes: list[str] = Field(default_factory=list)
    treatments: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    treatment_recommendation: Optional[TreatmentRecommendation] = Field(
        default=None, description="Detailed agronomic treatment plan from the verified treatment database."
    )
    image_metadata: Optional[ImageMetadata] = None
    predicted_at: datetime


class ErrorResponse(BaseModel):
    """Standard error envelope returned on validation, readiness, or server failures."""

    status: str = Field(default="error")
    code: str
    detail: str
    model_ready: Optional[bool] = None

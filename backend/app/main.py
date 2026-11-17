from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes.prediction import router as prediction_router
from app.routes.treatment import router as treatment_router
from app.schemas.prediction_schema import ErrorResponse
from app.services.image_processor import InvalidImageError
from app.services.predictor import (
    ModelNotReadyError,
    PredictionError,
    get_predictor,
)
from app.services.treatment_service import TreatmentNotFoundError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize predictor state once during application startup."""
    settings = get_settings()
    predictor = get_predictor()
    predictor.load_model()
    logger.info(
        "Started %s (%s) | model_ready=%s",
        settings.app_name,
        settings.environment,
        predictor.is_ready,
    )
    yield


def _error_json_response(
    *,
    status_code: int,
    code: str,
    detail: str,
    model_ready: bool | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        status="error",
        code=code,
        detail=detail,
        model_ready=model_ready,
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "FastAPI backend for PlantCare AI plant leaf image validation, "
            "preprocessing, and disease classification."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(InvalidImageError)
    async def handle_invalid_image(
        request: Request,
        exc: InvalidImageError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=exc.status_code,
            code=exc.code,
            detail=exc.message,
        )

    @app.exception_handler(ModelNotReadyError)
    async def handle_model_not_ready(
        request: Request,
        exc: ModelNotReadyError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=exc.status_code,
            code=exc.code,
            detail=exc.message,
            model_ready=False,
        )

    @app.exception_handler(PredictionError)
    async def handle_prediction_error(
        request: Request,
        exc: PredictionError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=exc.status_code,
            code=exc.code,
            detail=exc.message,
        )

    @app.exception_handler(TreatmentNotFoundError)
    async def handle_treatment_not_found(
        request: Request,
        exc: TreatmentNotFoundError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=exc.status_code,
            code=exc.code,
            detail=str(exc),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_json_response(
            status_code=422,
            code="VALIDATION_ERROR",
            detail="Invalid request payload. Ensure a leaf image is sent under the 'file' form field.",
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled error during request %s %s", request.method, request.url)
        return _error_json_response(
            status_code=500,
            code="INTERNAL_SERVER_ERROR",
            detail="An unexpected server error occurred while processing the request.",
        )

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "health_endpoint": "/api/health",
            "predict_endpoint": "/api/predict",
            "treatments_endpoint": "/api/treatments",
            "docs_url": "/docs",
        }

    app.include_router(prediction_router)
    app.include_router(treatment_router)
    return app


app = create_app()


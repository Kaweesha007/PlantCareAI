from dataclasses import dataclass
import io
from pathlib import Path
from fastapi import UploadFile
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import Settings

READ_CHUNK_SIZE = 256 * 1024  # 256 KB chunks for bounded memory reads


class InvalidImageError(Exception):
    """Raised when an uploaded file fails format, size, or image integrity checks."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "INVALID_IMAGE",
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class ImageTooLargeError(InvalidImageError):
    """Raised when an uploaded image exceeds the configured maximum size."""

    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=413, code="IMAGE_TOO_LARGE")


@dataclass(frozen=True)
class PreprocessedImage:
    """Validated and resized leaf image tensor ready for CNN inference."""

    tensor: np.ndarray
    filename: str
    content_type: str
    image_format: str
    size_bytes: int
    original_size: tuple[int, int]
    processed_size: tuple[int, int]


def _format_size_mb(size_bytes: int) -> str:
    return f"{size_bytes / (1024 * 1024):.2f} MB"


def validate_upload_metadata(file: UploadFile, settings: Settings) -> str:
    """Validate filename presence, extension, and HTTP MIME type before reading bytes."""
    if file is None or not file.filename:
        raise InvalidImageError("No leaf image file was provided.")

    extension = Path(file.filename).suffix.lower()
    if extension not in settings.allowed_extensions:
        allowed = ", ".join(settings.allowed_extensions)
        raise InvalidImageError(
            f"Unsupported file extension '{extension or 'none'}'. Allowed formats: {allowed}."
        )

    content_type = (file.content_type or "").lower().strip()
    if content_type and content_type not in settings.allowed_mime_types:
        raise InvalidImageError(
            f"Unsupported content type '{content_type}'. Please upload a JPG, JPEG, or PNG image."
        )

    return content_type or "application/octet-stream"


async def read_validated_image_bytes(file: UploadFile, settings: Settings) -> bytes:
    """Read uploaded bytes in bounded chunks, rejecting empty or oversized payloads."""
    chunks: list[bytes] = []
    total_bytes = 0

    while True:
        chunk = await file.read(READ_CHUNK_SIZE)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > settings.max_image_size_bytes:
            raise ImageTooLargeError(
                f"Uploaded image exceeds the maximum allowed size of "
                f"{_format_size_mb(settings.max_image_size_bytes)}."
            )
        chunks.append(chunk)

    if total_bytes == 0:
        raise InvalidImageError("The uploaded image file is empty.")

    return b"".join(chunks)


def preprocess_leaf_image(
    image_bytes: bytes,
    *,
    filename: str,
    content_type: str,
    settings: Settings,
) -> PreprocessedImage:
    """Verify image integrity with Pillow and convert it into a MobileNetV2-ready tensor."""
    try:
        with Image.open(io.BytesIO(image_bytes)) as probe_image:
            detected_format = (probe_image.format or "").upper()
            if detected_format not in settings.allowed_image_formats:
                raise InvalidImageError(
                    f"Unsupported image content format '{detected_format or 'unknown'}'. "
                    "Only JPEG and PNG images are accepted."
                )
            probe_image.verify()

        with Image.open(io.BytesIO(image_bytes)) as decoded_image:
            transposed = ImageOps.exif_transpose(decoded_image)
            rgb_image = transposed.convert("RGB")
            original_size = rgb_image.size

            if original_size[0] <= 0 or original_size[1] <= 0:
                raise InvalidImageError("Uploaded image has invalid dimensions.")

            resized = rgb_image.resize(
                settings.image_input_size,
                resample=Image.Resampling.LANCZOS,
            )
            image_array = np.asarray(resized, dtype=np.float32)
    except InvalidImageError:
        raise
    except Image.DecompressionBombError as exc:
        raise InvalidImageError(
            "Image resolution is too large to process safely."
        ) from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImageError(
            "The uploaded file is corrupted or is not a valid JPG/PNG image."
        ) from exc

    # Scale RGB pixels from [0, 255] to [-1, 1] for MobileNetV2 transfer learning.
    normalized = (image_array / 127.5) - 1.0
    batched_tensor = np.expand_dims(normalized, axis=0)

    return PreprocessedImage(
        tensor=batched_tensor,
        filename=filename,
        content_type=content_type,
        image_format=detected_format,
        size_bytes=len(image_bytes),
        original_size=original_size,
        processed_size=settings.image_input_size,
    )


async def validate_and_preprocess_upload(
    file: UploadFile,
    settings: Settings,
) -> PreprocessedImage:
    """Validate upload metadata, read size-bounded bytes, and preprocess with Pillow."""
    content_type = validate_upload_metadata(file, settings)
    image_bytes = await read_validated_image_bytes(file, settings)
    return preprocess_leaf_image(
        image_bytes,
        filename=file.filename or "leaf_image",
        content_type=content_type,
        settings=settings,
    )


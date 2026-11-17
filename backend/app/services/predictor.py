from datetime import datetime, timezone
from functools import lru_cache
import json
import logging
from pathlib import Path
from typing import Any
import numpy as np

from app.config import get_settings
from app.schemas.prediction_schema import (
    AlternativePrediction,
    ImageMetadata,
    PredictionResponse,
)
from app.services.image_processor import PreprocessedImage
from app.services.treatment_service import get_treatment_service

logger = logging.getLogger(__name__)

MIN_VALID_KERAS_BYTES = 64

DISEASE_GUIDANCE: dict[str, dict[str, Any]] = {
    "Pepper__bell___Bacterial_spot": {
        "plant_name": "Bell Pepper",
        "disease_name": "Bacterial Spot",
        "severity": "High",
        "symptoms": [
            "Small water-soaked leaf spots turning dark brown or black with papery centers.",
            "Yellowing around lesions followed by premature leaf drop.",
        ],
        "causes": [
            "Xanthomonas bacteria spread by rain splash, overhead watering, and wet handling.",
            "Contaminated seed, transplants, or crop residue.",
        ],
        "treatments": [
            "Avoid working in plants while foliage is wet.",
            "Apply copper-based bactericides per local agronomic guidance.",
            "Remove heavily infected leaves or plants early to limit spread.",
        ],
        "prevention": [
            "Use certified disease-free seed and resistant bell pepper varieties.",
            "Rotate peppers out of infected beds for 2–3 years.",
        ],
    },
    "Pepper__bell___healthy": {
        "plant_name": "Bell Pepper",
        "disease_name": "Healthy",
        "severity": "None",
        "symptoms": [
            "Uniform green foliage with intact margins and no necrotic or water-soaked lesions.",
        ],
        "causes": [
            "Balanced watering, adequate soil nutrition, and low pathogen pressure.",
        ],
        "treatments": [
            "No disease treatment needed; continue weekly field scouting.",
        ],
        "prevention": [
            "Maintain drip irrigation and sanitize tools between beds.",
        ],
    },
    "Potato___Early_blight": {
        "plant_name": "Potato",
        "disease_name": "Early Blight",
        "severity": "Moderate",
        "symptoms": [
            "Dark brown angular leaf spots showing concentric target-like rings.",
            "Gradual yellowing and senescence starting on lower older leaves.",
        ],
        "causes": [
            "Alternaria solani fungal spores persisting in soil and plant debris.",
            "Warm weather alternating with heavy dew or moisture stress.",
        ],
        "treatments": [
            "Maintain adequate nitrogen and potassium fertility to support leaf vigor.",
            "Apply recommended protectant fungicides when lower lesions expand.",
        ],
        "prevention": [
            "Rotate potatoes with non-solanaceous crops every 3 years.",
            "Remove or incorporate infected plant residue after harvest.",
        ],
    },
    "Potato___Late_blight": {
        "plant_name": "Potato",
        "disease_name": "Late Blight",
        "severity": "High",
        "symptoms": [
            "Irregular dark water-soaked blotches spreading rapidly from leaf tips and edges.",
            "White cottony sporulation on leaf undersides during cool, humid mornings.",
        ],
        "causes": [
            "Phytophthora infestans airborne sporangia or infected seed tubers.",
            "Cool, wet, misty conditions with prolonged leaf wetness.",
        ],
        "treatments": [
            "Apply approved oomycete-targeted fungicides immediately upon detection.",
            "Destroy infected foliage prior to harvest to protect developing tubers.",
        ],
        "prevention": [
            "Plant certified disease-free seed tubers and destroy volunteer plants.",
        ],
    },
    "Potato___healthy": {
        "plant_name": "Potato",
        "disease_name": "Healthy",
        "severity": "None",
        "symptoms": [
            "Healthy green compound leaves without blight blotches or concentric lesions.",
        ],
        "causes": [
            "Effective disease prevention, clean seed stock, and balanced moisture.",
        ],
        "treatments": [
            "No intervention required; keep monitoring foliage during damp weather.",
        ],
        "prevention": [
            "Hill soil properly over tubers and ensure good canopy airflow.",
        ],
    },
    "Tomato_Bacterial_spot": {
        "plant_name": "Tomato",
        "disease_name": "Bacterial Spot",
        "severity": "High",
        "symptoms": [
            "Greasy dark brown to black spots on leaves often surrounded by yellow halos.",
            "Torn or shot-hole appearance as dried lesions crack.",
        ],
        "causes": [
            "Xanthomonas bacterial infection spread by splashing water and handling.",
        ],
        "treatments": [
            "Stop overhead irrigation and avoid pruning while foliage is wet.",
            "Apply recommended copper protectant sprays early in outbreak development.",
        ],
        "prevention": [
            "Source treated seed and sanitize greenhouse benches and stakes.",
        ],
    },
    "Tomato_Early_blight": {
        "plant_name": "Tomato",
        "disease_name": "Early Blight",
        "severity": "Moderate",
        "symptoms": [
            "Brown circular lesions with concentric rings ('target' pattern) on lower leaves.",
            "Yellowing halo expanding around older lesions.",
        ],
        "causes": [
            "Alternaria solani spores splashing from soil onto lower foliage.",
            "Warm temperatures paired with frequent dew or rain.",
        ],
        "treatments": [
            "Prune heavily spotted lower leaves to improve airflow.",
            "Apply targeted protectant fungicides and water strictly at the root zone.",
        ],
        "prevention": [
            "Mulch soil beneath plants and rotate away from tomatoes for 2–3 years.",
        ],
    },
    "Tomato_Late_blight": {
        "plant_name": "Tomato",
        "disease_name": "Late Blight",
        "severity": "High",
        "symptoms": [
            "Large dark green-to-black water-soaked leaf blotches and stem lesions.",
            "White mold fuzz visible beneath leaves under high humidity.",
        ],
        "causes": [
            "Phytophthora infestans spores carried by wind and favored by cool wet weather.",
        ],
        "treatments": [
            "Remove and bag severely infected plants immediately to protect nearby rows.",
            "Use recommended late-blight fungicides preventively when weather favors spread.",
        ],
        "prevention": [
            "Space plants generously and avoid late-evening irrigation.",
        ],
    },
    "Tomato_Leaf_Mold": {
        "plant_name": "Tomato",
        "disease_name": "Leaf Mold",
        "severity": "Moderate",
        "symptoms": [
            "Pale green or yellow diffuse spots on upper leaf surfaces.",
            "Olive-green to brownish velvety mold patches on corresponding leaf undersides.",
        ],
        "causes": [
            "Passalora fulva fungus thriving in high humidity (>85%) and stagnant greenhouse air.",
        ],
        "treatments": [
            "Increase greenhouse ventilation and lower relative humidity.",
            "Remove affected lower foliage and apply labeled fungicides if persistent.",
        ],
        "prevention": [
            "Grow mold-resistant cultivars and prune suckers for airflow.",
        ],
    },
    "Tomato_Septoria_leaf_spot": {
        "plant_name": "Tomato",
        "disease_name": "Septoria Leaf Spot",
        "severity": "Moderate",
        "symptoms": [
            "Numerous small circular spots with dark brown borders and tan-gray centers.",
            "Tiny black speckling (pycnidia) visible inside mature spots.",
        ],
        "causes": [
            "Septoria lycopersici fungus overwintering in debris and splashing during rain.",
        ],
        "treatments": [
            "Remove infected lower leaves and sanitize pruning shears.",
            "Apply copper or recommended foliar fungicides at early symptom onset.",
        ],
        "prevention": [
            "Mulch around stems, stake plants upright, and rotate crops.",
        ],
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "plant_name": "Tomato",
        "disease_name": "Two-Spotted Spider Mite Damage",
        "severity": "Moderate",
        "symptoms": [
            "Fine yellow or white stippling across upper leaf surfaces.",
            "Bronzing leaves and delicate webbing on undersides during severe infestations.",
        ],
        "causes": [
            "Tetranychus urticae mites multiplying rapidly in hot, dry, dusty conditions.",
        ],
        "treatments": [
            "Spray leaf undersides firmly with water or apply insecticidal soap/miticide.",
            "Introduce predatory mites where biological control is practiced.",
        ],
        "prevention": [
            "Reduce plant drought stress and suppress field dust.",
        ],
    },
    "Tomato__Target_Spot": {
        "plant_name": "Tomato",
        "disease_name": "Target Spot",
        "severity": "Moderate",
        "symptoms": [
            "Small brown necrotic lesions enlarging with faint concentric rings and yellow margins.",
            "Can progress to defoliation and fruit spotting under warm humidity.",
        ],
        "causes": [
            "Corynespora cassiicola fungus favored by warm, wet, shaded canopies.",
        ],
        "treatments": [
            "Prune dense foliage to enhance airflow and light penetration.",
            "Use recommended fungicides registered for target spot management.",
        ],
        "prevention": [
            "Avoid prolonged leaf wetness and remove post-harvest crop debris.",
        ],
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "plant_name": "Tomato",
        "disease_name": "Tomato Yellow Leaf Curl Virus",
        "severity": "High",
        "symptoms": [
            "Upward cupping and curling of young leaves with bright yellow margins.",
            "Stunted plant growth and reduced flower/fruit set.",
        ],
        "causes": [
            "Viral infection transmitted by silverleaf whiteflies (Bemisia tabaci).",
        ],
        "treatments": [
            "Rogue out severely stunted symptomatic plants early to reduce virus reservoirs.",
            "Control whitefly vectors using yellow sticky traps, insect netting, or approved controls.",
        ],
        "prevention": [
            "Plant TYLCV-resistant tomato varieties and screen greenhouse vents.",
        ],
    },
    "Tomato__Tomato_mosaic_virus": {
        "plant_name": "Tomato",
        "disease_name": "Tomato Mosaic Virus",
        "severity": "High",
        "symptoms": [
            "Light and dark green mottled mosaic patterning on leaves.",
            "Narrowed, fern-like, or distorted young foliage.",
        ],
        "causes": [
            "Highly stable tobamovirus spread mechanically by hands, tools, and infected seed.",
        ],
        "treatments": [
            "No chemical cure exists; isolate or remove infected plants to protect healthy rows.",
            "Wash hands thoroughly and disinfect tools with appropriate virucidal solutions.",
        ],
        "prevention": [
            "Use certified virus-tested seed and resistant cultivars.",
        ],
    },
    "Tomato_healthy": {
        "plant_name": "Tomato",
        "disease_name": "Healthy",
        "severity": "None",
        "symptoms": [
            "Consistent green leaf coloration with no spots, curling, mold, or stippling.",
        ],
        "causes": [
            "Balanced fertilization, drip irrigation, and sound pest/disease hygiene.",
        ],
        "treatments": [
            "No treatment required; continue periodic scouting.",
        ],
        "prevention": [
            "Maintain airflow through pruning and clean garden tools.",
        ],
    },
}


class ModelNotReadyError(Exception):
    """Raised when inference is requested before a trained AI model is available."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
        self.code = "MODEL_NOT_READY"
        self.status_code = 503


class PredictionError(Exception):
    """Raised when model inference fails or produces malformed output."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
        self.code = "PREDICTION_FAILED"
        self.status_code = 500


def _parse_raw_class_label(raw_label: str) -> tuple[str, str]:
    """Parse fallback plant and disease names from a folder-style class label."""
    if "___" in raw_label:
        plant_part, disease_part = raw_label.split("___", 1)
    elif "__" in raw_label:
        plant_part, disease_part = raw_label.split("__", 1)
    elif "_" in raw_label:
        plant_part, disease_part = raw_label.split("_", 1)
    else:
        cleaned = " ".join(raw_label.split()).strip() or "Unknown"
        return "Unknown Plant", cleaned

    plant_name = " ".join(plant_part.replace("_", " ").split()).title()
    disease_name = " ".join(disease_part.replace("_", " ").split())
    if disease_name.lower() == "healthy":
        disease_name = "Healthy"
    else:
        disease_name = disease_name.title()
    return plant_name or "Unknown Plant", disease_name or raw_label


def _extract_output_class_count(model: Any) -> int | None:
    """Safely extract the final classification dimension from a loaded Keras model."""
    output_shape = getattr(model, "output_shape", None)
    if isinstance(output_shape, list) and output_shape:
        output_shape = output_shape[0]
    if isinstance(output_shape, tuple) and len(output_shape) >= 2:
        last_dim = output_shape[-1]
        if isinstance(last_dim, int) and last_dim > 0:
            return last_dim
    return None


class LeafDiseasePredictor:
    """Encapsulates model loading and TensorFlow/Keras inference outside API routes."""

    def __init__(
        self,
        model_path: Path,
        labels_path: Path,
        *,
        gatekeeper_model_path: Path | None = None,
        gatekeeper_labels_path: Path | None = None,
        confidence_threshold: float = 0.60,
        gatekeeper_threshold: float = 0.65,
        top_k_alternatives: int = 3,
    ) -> None:
        self.model_path = model_path
        self.labels_path = labels_path
        self.gatekeeper_model_path = gatekeeper_model_path
        self.gatekeeper_labels_path = gatekeeper_labels_path
        self.confidence_threshold = confidence_threshold
        self.gatekeeper_threshold = gatekeeper_threshold
        self.top_k_alternatives = top_k_alternatives
        self._model: Any = None
        self._gatekeeper_model: Any = None
        self._gatekeeper_classes: list[str] = []
        self._class_labels: list[dict[str, Any]] = []
        self._load_attempted = False
        self._status_message = (
            f"Model has not been loaded yet (expected at '{self.model_path}')."
        )

    @property
    def is_ready(self) -> bool:
        return self._model is not None and len(self._class_labels) > 0

    @property
    def is_gatekeeper_ready(self) -> bool:
        return self._gatekeeper_model is not None and len(self._gatekeeper_classes) > 0

    @property
    def class_count(self) -> int:
        return len(self._class_labels)

    @property
    def status_message(self) -> str:
        return self._status_message

    def _enrich_label_entry(self, entry: dict[str, Any]) -> dict[str, Any]:
        raw_label = str(
            entry.get("label") or entry.get("class_label") or entry.get("disease_name") or ""
        ).strip()
        catalog = DISEASE_GUIDANCE.get(raw_label, {})
        fallback_plant, fallback_disease = _parse_raw_class_label(raw_label)

        plant_name = str(
            entry.get("plant_name") or catalog.get("plant_name") or fallback_plant
        )
        disease_name = str(
            entry.get("disease_name") or catalog.get("disease_name") or fallback_disease
        )

        return {
            "class_label": raw_label or disease_name,
            "plant_name": plant_name,
            "disease_name": disease_name,
            "severity": entry.get("severity")
            or catalog.get("severity")
            or ("None" if disease_name.lower() == "healthy" else None),
            "symptoms": list(entry.get("symptoms") or catalog.get("symptoms") or []),
            "causes": list(entry.get("causes") or catalog.get("causes") or []),
            "treatments": list(entry.get("treatments") or catalog.get("treatments") or []),
            "prevention": list(entry.get("prevention") or catalog.get("prevention") or []),
        }

    def _load_labels(self) -> list[dict[str, Any]]:
        if not self.labels_path.exists() or not self.labels_path.is_file():
            raise FileNotFoundError(
                f"Class names file not found at '{self.labels_path}'."
            )

        raw_text = self.labels_path.read_text(encoding="utf-8").strip()
        if not raw_text:
            raise ValueError(
                f"Class names file '{self.labels_path}' is empty."
            )

        raw = json.loads(raw_text)
        entries: list[dict[str, Any]] = []

        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, str):
                    entries.append(self._enrich_label_entry({"label": item}))
                elif isinstance(item, dict):
                    entries.append(self._enrich_label_entry(item))
                else:
                    raise ValueError("Unsupported entry type inside class_names.json list.")
        elif isinstance(raw, dict):
            if all(str(key).isdigit() for key in raw):
                ordered = sorted(raw.items(), key=lambda item: int(item[0]))
                for _, val in ordered:
                    base = val if isinstance(val, dict) else {"label": str(val)}
                    entries.append(self._enrich_label_entry(base))
            elif all(isinstance(val, int) for val in raw.values()):
                ordered = sorted(raw.items(), key=lambda item: item[1])
                for key, _ in ordered:
                    entries.append(self._enrich_label_entry({"label": str(key)}))
            else:
                raise ValueError("Unsupported dictionary mapping inside class_names.json.")
        else:
            raise ValueError("class_names.json must be a JSON array or mapping.")

        if not entries:
            raise ValueError("class_names.json contains zero class labels.")

        return entries

    def load_model(self) -> bool:
        """Load the Keras model and matching class_names.json once on backend startup."""
        self._load_attempted = True

        if (
            not self.model_path.exists()
            or not self.model_path.is_file()
            or self.model_path.stat().st_size < MIN_VALID_KERAS_BYTES
        ):
            self._model = None
            self._class_labels = []
            self._status_message = (
                f"Trained AI model is not available yet (missing or empty placeholder: '{self.model_path}')."
            )
            logger.info(self._status_message)
            return False

        try:
            class_labels = self._load_labels()
        except Exception as exc:
            self._model = None
            self._class_labels = []
            self._status_message = f"Failed to load class names: {exc}"
            logger.warning(self._status_message)
            return False

        try:
            # Lazy import keeps FastAPI startup lightweight while the model file is absent.
            import tensorflow as tf

            loaded_model = tf.keras.models.load_model(self.model_path)
            output_classes = _extract_output_class_count(loaded_model)
            if output_classes is not None and output_classes != len(class_labels):
                raise ValueError(
                    f"Model output dimension ({output_classes}) does not match "
                    f"class_names.json count ({len(class_labels)})."
                )

            self._model = loaded_model
            self._class_labels = class_labels
            self._status_message = (
                f"Loaded trained model from '{self.model_path}' with {len(class_labels)} classes."
            )
            logger.info(self._status_message)

            # Load Gatekeeper Model if available
            if self.gatekeeper_model_path and self.gatekeeper_model_path.exists():
                try:
                    self._gatekeeper_model = tf.keras.models.load_model(self.gatekeeper_model_path)
                    if self.gatekeeper_labels_path and self.gatekeeper_labels_path.exists():
                        with open(self.gatekeeper_labels_path, "r", encoding="utf-8") as f:
                            raw_gk = json.load(f)
                        if isinstance(raw_gk, dict):
                            ordered_gk = sorted(raw_gk.items(), key=lambda x: int(x[0]))
                            self._gatekeeper_classes = [val for _, val in ordered_gk]
                        elif isinstance(raw_gk, list):
                            self._gatekeeper_classes = [str(x) for x in raw_gk]
                    logger.info(
                        f"Loaded gatekeeper model from '{self.gatekeeper_model_path}' with {len(self._gatekeeper_classes)} classes: {self._gatekeeper_classes}."
                    )
                except Exception as gk_exc:
                    logger.warning(f"Failed to load gatekeeper model: {gk_exc}")
                    self._gatekeeper_model = None

            return True
        except Exception as exc:
            self._model = None
            self._class_labels = []
            self._status_message = (
                f"Failed to load trained model from '{self.model_path}': {exc}"
            )
            logger.exception("Error while loading Keras model artifact.")
            return False

    def _build_alternative(self, index: int, score: float) -> AlternativePrediction:
        info = self._class_labels[index]
        return AlternativePrediction(
            class_label=info["class_label"],
            plant_name=info["plant_name"],
            disease_name=info["disease_name"],
            confidence_score=score,
        )

    def predict(self, preprocessed: PreprocessedImage) -> PredictionResponse:
        """Run leaf disease inference on a preprocessed image tensor."""
        if not self._load_attempted:
            self.load_model()

        if not self.is_ready:
            raise ModelNotReadyError(
                "Trained AI model is not available yet. "
                f"Expected trained model at '{self.model_path}' and class names at '{self.labels_path}'."
            )

        # Stage 1: Plant Identification & Verification Gatekeeper
        if self.is_gatekeeper_ready:
            try:
                gk_preds = self._gatekeeper_model.predict(preprocessed.tensor, verbose=0)
                gk_arr = np.asarray(gk_preds, dtype=np.float32).flatten()
                gk_top_idx = int(np.argmax(gk_arr))
                gk_top_conf = float(np.clip(gk_arr[gk_top_idx], 0.0, 1.0))
                gk_class = (
                    self._gatekeeper_classes[gk_top_idx]
                    if gk_top_idx < len(self._gatekeeper_classes)
                    else "unknown"
                )

                metadata = ImageMetadata(
                    filename=preprocessed.filename,
                    content_type=preprocessed.content_type,
                    format=preprocessed.image_format,
                    size_bytes=preprocessed.size_bytes,
                    original_width=preprocessed.original_size[0],
                    original_height=preprocessed.original_size[1],
                    processed_size=list(preprocessed.processed_size),
                )
                predicted_at = datetime.now(timezone.utc)

                # Check 1: Detected unsupported plant species
                if gk_class == "unsupported" and gk_top_conf >= self.gatekeeper_threshold:
                    return PredictionResponse(
                        status="unsupported",
                        is_supported=False,
                        is_uncertain=False,
                        class_label="Unsupported_Plant",
                        plant_name="Unsupported Plant",
                        disease_name="Unsupported Plant Species",
                        confidence_score=gk_top_conf,
                        confidence_threshold=self.gatekeeper_threshold,
                        message="Unsupported Plant. PlantCare AI currently supports Tomato, Potato and Bell Pepper only.",
                        top_alternatives=[],
                        severity="None",
                        symptoms=[
                            "The uploaded leaf photograph does not belong to any of PlantCare AI's supported crops."
                        ],
                        causes=[
                            "PlantCare AI is designed specifically for Tomato, Potato, and Bell Pepper crops.",
                            f"The gatekeeper model identified this leaf as unsupported with {gk_top_conf:.1%} confidence."
                        ],
                        treatments=[
                            "Please upload a close-up photograph of a Tomato, Potato, or Bell Pepper leaf to receive a disease diagnosis."
                        ],
                        prevention=[
                            "Confirm the crop type before uploading; unsupported plants cannot be reliably diagnosed."
                        ],
                        image_metadata=metadata,
                        predicted_at=predicted_at,
                    )

                # Check 2: Uncertain plant identification
                if gk_top_conf < self.gatekeeper_threshold:
                    return PredictionResponse(
                        status="uncertain",
                        is_supported=False,
                        is_uncertain=True,
                        class_label="Uncertain_Plant",
                        plant_name="Uncertain",
                        disease_name="Uncertain Plant Identification",
                        confidence_score=gk_top_conf,
                        confidence_threshold=self.gatekeeper_threshold,
                        message="Unable to reliably identify the plant leaf species. Please upload a clearer photograph.",
                        top_alternatives=[],
                        severity="Uncertain",
                        symptoms=[
                            "The uploaded image could not be reliably classified into a supported crop."
                        ],
                        causes=[
                            f"Gatekeeper confidence ({gk_top_conf:.1%}) is below the identification threshold ({self.gatekeeper_threshold:.0%}).",
                            "Possible causes include blurry focus, complex backgrounds, low lighting, or an atypical leaf view."
                        ],
                        treatments=[
                            "Capture a well-lit, sharp close-up of a single leaf against a plain background.",
                            "Ensure the leaf is centered and fills the majority of the frame."
                        ],
                        prevention=[],
                        image_metadata=metadata,
                        predicted_at=predicted_at,
                    )

            except Exception as gk_exc:
                logger.warning(
                    f"Gatekeeper prediction encountered an error, proceeding with disease model: {gk_exc}"
                )

        try:
            raw_predictions = self._model.predict(preprocessed.tensor, verbose=0)
            raw_array = np.asarray(raw_predictions, dtype=np.float32)

            if raw_array.ndim == 2 and raw_array.shape[0] == 1:
                probabilities = raw_array[0]
            elif raw_array.ndim == 1:
                probabilities = raw_array
            else:
                raise PredictionError(
                    f"Model returned unexpected prediction tensor shape {raw_array.shape}."
                )

            if probabilities.size != len(self._class_labels):
                raise PredictionError(
                    f"Model returned {probabilities.size} class scores, expected {len(self._class_labels)}."
                )

            if not np.all(np.isfinite(probabilities)):
                raise PredictionError("Model returned non-finite confidence values.")
        except PredictionError:
            raise
        except Exception as exc:
            logger.exception("Inference execution failed.")
            raise PredictionError(f"Model inference failed: {exc}") from exc

        sorted_indices = np.argsort(probabilities)[::-1]
        top_index = int(sorted_indices[0])
        top_confidence = float(np.clip(probabilities[top_index], 0.0, 1.0))

        metadata = ImageMetadata(
            filename=preprocessed.filename,
            content_type=preprocessed.content_type,
            format=preprocessed.image_format,
            size_bytes=preprocessed.size_bytes,
            original_width=preprocessed.original_size[0],
            original_height=preprocessed.original_size[1],
            processed_size=list(preprocessed.processed_size),
        )
        predicted_at = datetime.now(timezone.utc)

        if top_confidence < self.confidence_threshold:
            candidate_indices = sorted_indices[: self.top_k_alternatives]
            top_alternatives = [
                self._build_alternative(
                    int(idx),
                    float(np.clip(probabilities[int(idx)], 0.0, 1.0)),
                )
                for idx in candidate_indices
            ]
            return PredictionResponse(
                status="uncertain",
                is_uncertain=True,
                class_label=None,
                plant_name="Uncertain",
                disease_name="Uncertain Prediction",
                confidence_score=top_confidence,
                confidence_threshold=self.confidence_threshold,
                message=(
                    f"Top confidence ({top_confidence:.1%}) is below the confirmation "
                    f"threshold ({self.confidence_threshold:.1%}). Retake a clear photo "
                    "of a single leaf or inspect the closest candidate matches."
                ),
                top_alternatives=top_alternatives,
                severity="Uncertain",
                symptoms=[],
                causes=[
                    "Model confidence did not meet the minimum threshold for a confirmed disease diagnosis.",
                    "Possible causes include blurry focus, poor lighting, complex backgrounds, or an unsupported crop.",
                ],
                treatments=[
                    "Capture a well-lit, sharp close-up of a single affected leaf against a plain background.",
                    "Confirm that the crop is covered by the trained model or consult an agricultural specialist.",
                ],
                prevention=[],
                image_metadata=metadata,
                predicted_at=predicted_at,
            )

        alt_indices = sorted_indices[1 : 1 + self.top_k_alternatives]
        top_alternatives = [
            self._build_alternative(
                int(idx),
                float(np.clip(probabilities[int(idx)], 0.0, 1.0)),
            )
            for idx in alt_indices
        ]
        label_info = self._class_labels[top_index]

        treatment_rec = None
        try:
            treatment_service = get_treatment_service()
            treatment_rec = treatment_service.get_by_class_label(label_info["class_label"])
        except Exception as t_err:
            logger.warning("Could not load treatment recommendation for '%s': %s", label_info["class_label"], t_err)

        effective_symptoms = (
            treatment_rec.common_symptoms
            if treatment_rec and treatment_rec.common_symptoms
            else label_info["symptoms"]
        )
        effective_treatments = (
            treatment_rec.immediate_actions + treatment_rec.cultural_and_preventive_practices[:2]
            if treatment_rec and treatment_rec.condition_type != "healthy" and treatment_rec.immediate_actions
            else (
                treatment_rec.cultural_and_preventive_practices
                if treatment_rec and treatment_rec.condition_type == "healthy"
                else label_info["treatments"]
            )
        )
        effective_prevention = (
            treatment_rec.prevention_tips
            if treatment_rec and treatment_rec.prevention_tips
            else label_info["prevention"]
        )

        return PredictionResponse(
            status="confirmed",
            is_uncertain=False,
            class_label=label_info["class_label"],
            plant_name=label_info["plant_name"],
            disease_name=label_info["disease_name"],
            confidence_score=top_confidence,
            confidence_threshold=self.confidence_threshold,
            message=(
                f"Prediction confirmed above the {self.confidence_threshold:.0%} confidence threshold."
            ),
            top_alternatives=top_alternatives,
            severity=label_info["severity"],
            symptoms=effective_symptoms,
            causes=label_info["causes"],
            treatments=effective_treatments,
            prevention=effective_prevention,
            treatment_recommendation=treatment_rec,
            image_metadata=metadata,
            predicted_at=predicted_at,
        )


@lru_cache(maxsize=1)
def get_predictor() -> LeafDiseasePredictor:
    """Provide a shared LeafDiseasePredictor instance configured from Settings."""
    settings = get_settings()
    return LeafDiseasePredictor(
        model_path=settings.model_path,
        labels_path=settings.labels_path,
        gatekeeper_model_path=settings.gatekeeper_model_path,
        gatekeeper_labels_path=settings.gatekeeper_labels_path,
        confidence_threshold=settings.confidence_threshold,
        gatekeeper_threshold=settings.gatekeeper_threshold,
        top_k_alternatives=settings.top_k_alternatives,
    )

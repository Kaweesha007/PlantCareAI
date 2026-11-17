"""Train a MobileNetV2 plant leaf disease classifier for PlantCare AI.

Pipeline overview:
1. Load preprocessed 224x224 train/val datasets from ``ai-model/dataset/processed``.
2. Save exact class index order to ``ai-model/trained_model/class_names.json``.
3. Apply data augmentation strictly to the training stream (before MobileNetV2 scaling).
4. Apply ``tf.keras.applications.mobilenet_v2.preprocess_input`` identically across
   training and validation (mapping RGB [0, 255] -> [-1.0, 1.0], matching the FastAPI backend).
5. Stage 1: Train classification head (GlobalAveragePooling2D + Dropout + Dense softmax)
   with frozen MobileNetV2 ImageNet base using categorical cross-entropy.
6. Stage 2 (optional/configurable): Unfreeze top layers of MobileNetV2 (keeping
   BatchNormalization layers frozen) and fine-tune with a lower learning rate.
7. Save the best checkpoint in Keras ``.keras`` format using ``ModelCheckpoint`` and
   record training metrics to ``training_history.json``.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import random
import sys
from typing import Any, Iterable

import numpy as np
import tensorflow as tf

AI_MODEL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATASET_DIR = AI_MODEL_DIR / "dataset" / "processed"
DEFAULT_MODEL_PATH = AI_MODEL_DIR / "trained_model" / "plant_disease_model.keras"
DEFAULT_CLASS_NAMES_PATH = AI_MODEL_DIR / "trained_model" / "class_names.json"
DEFAULT_HISTORY_PATH = AI_MODEL_DIR / "trained_model" / "training_history.json"

IMAGE_SIZE = (224, 224)


@dataclass(frozen=True)
class TrainConfig:
    """Configuration options for MobileNetV2 transfer learning and fine-tuning."""

    dataset_dir: Path
    model_path: Path
    class_names_path: Path
    history_path: Path
    epochs: int = 10
    fine_tune_epochs: int = 5
    fine_tune_at: int = 100
    batch_size: int = 32
    learning_rate: float = 1e-3
    fine_tune_lr: float = 1e-5
    dropout_rate: float = 0.3
    patience: int = 4
    seed: int = 42
    weights: str | None = "imagenet"


def set_reproducible_seed(seed: int) -> None:
    """Seed Python, NumPy, and TensorFlow RNGs."""
    random.seed(seed)
    np.random.seed(seed)
    tf.keras.utils.set_random_seed(seed)


def _save_json(payload: Any, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def load_datasets(
    dataset_dir: Path,
    *,
    image_size: tuple[int, int],
    batch_size: int,
    seed: int,
) -> tuple[tf.data.Dataset, tf.data.Dataset, list[str]]:
    """Load processed train and validation datasets and verify matching class indices."""
    train_dir = dataset_dir / "train"
    val_dir = dataset_dir / "val"

    if not train_dir.exists() or not train_dir.is_dir():
        raise FileNotFoundError(f"Training directory not found: '{train_dir}'")
    if not val_dir.exists() or not val_dir.is_dir():
        raise FileNotFoundError(f"Validation directory not found: '{val_dir}'")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="categorical",
        image_size=image_size,
        batch_size=batch_size,
        shuffle=True,
        seed=seed,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        labels="inferred",
        label_mode="categorical",
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False,
    )

    if train_ds.class_names != val_ds.class_names:
        raise ValueError(
            "Train and validation folders have mismatched class labels: "
            f"{train_ds.class_names} vs {val_ds.class_names}"
        )

    return train_ds, val_ds, list(train_ds.class_names)


def build_augmentation_layer(seed: int) -> tf.keras.Sequential:
    """Create training-only image augmentation layers operating on [0, 255] RGB tensors."""
    return tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal_and_vertical", seed=seed),
            tf.keras.layers.RandomRotation(0.15, seed=seed),
            tf.keras.layers.RandomZoom(0.15, seed=seed),
            tf.keras.layers.RandomContrast(0.1, seed=seed),
        ],
        name="train_augmentation",
    )


def prepare_pipelines(
    train_ds: tf.data.Dataset,
    val_ds: tf.data.Dataset,
    augmentation_layer: tf.keras.Sequential,
) -> tuple[tf.data.Dataset, tf.data.Dataset]:
    """Attach train-only augmentation and shared MobileNetV2 preprocessing."""
    autotune = tf.data.AUTOTUNE

    def preprocess_train(images: tf.Tensor, labels: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
        images = tf.cast(images, tf.float32)
        images = augmentation_layer(images, training=True)
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    def preprocess_val(images: tf.Tensor, labels: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
        images = tf.cast(images, tf.float32)
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    train_prepared = train_ds.map(preprocess_train, num_parallel_calls=autotune).prefetch(
        buffer_size=autotune
    )
    val_prepared = val_ds.map(preprocess_val, num_parallel_calls=autotune).prefetch(
        buffer_size=autotune
    )
    return train_prepared, val_prepared


def build_mobilenetv2_model(
    *,
    num_classes: int,
    image_size: tuple[int, int],
    dropout_rate: float,
    weights: str | None,
) -> tuple[tf.keras.Model, tf.keras.Model]:
    """Construct MobileNetV2 transfer learning model with frozen base and custom head."""
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(*image_size, 3),
        include_top=False,
        weights=weights,
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(*image_size, 3), name="leaf_image")
    # Keep BatchNormalization in inference mode so later fine-tuning preserves running stats.
    x = base_model(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = tf.keras.layers.Dropout(dropout_rate, name="head_dropout")(x)
    outputs = tf.keras.layers.Dense(
        num_classes,
        activation="softmax",
        name="predictions",
    )(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="plantcare_mobilenetv2")
    return model, base_model


def unfreeze_for_fine_tuning(base_model: tf.keras.Model, fine_tune_at: int) -> int:
    """Unfreeze layers from fine_tune_at onward while keeping BatchNormalization frozen."""
    total_layers = len(base_model.layers)
    if fine_tune_at < 0 or fine_tune_at >= total_layers:
        raise ValueError(
            f"--fine-tune-at ({fine_tune_at}) must be between 0 and {total_layers - 1}."
        )

    base_model.trainable = True
    unfrozen_count = 0

    for idx, layer in enumerate(base_model.layers):
        if idx < fine_tune_at or isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
        else:
            layer.trainable = True
            unfrozen_count += 1

    return unfrozen_count


def build_callbacks(
    *,
    model_path: Path,
    patience: int,
    initial_value_threshold: float | None = None,
) -> list[tf.keras.callbacks.Callback]:
    """Create ModelCheckpoint, EarlyStopping, and ReduceLROnPlateau callbacks."""
    model_path.parent.mkdir(parents=True, exist_ok=True)
    checkpoint_cb = tf.keras.callbacks.ModelCheckpoint(
        filepath=str(model_path),
        monitor="val_accuracy",
        mode="max",
        save_best_only=True,
        initial_value_threshold=initial_value_threshold,
        verbose=1,
    )
    early_stopping_cb = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        mode="min",
        patience=patience,
        restore_best_weights=True,
        verbose=1,
    )
    reduce_lr_cb = tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        mode="min",
        factor=0.5,
        patience=max(1, patience // 2),
        min_lr=1e-7,
        verbose=1,
    )
    return [checkpoint_cb, early_stopping_cb, reduce_lr_cb]


def _compile_model(model: tf.keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=[tf.keras.metrics.CategoricalAccuracy(name="accuracy")],
    )


def _serialize_history(history: tf.keras.callbacks.History) -> dict[str, list[float]]:
    return {
        key: [float(value) for value in values]
        for key, values in history.history.items()
    }


def train_model(config: TrainConfig) -> dict[str, Any]:
    """Execute Stage 1 (frozen base) and optional Stage 2 (fine-tuning) training."""
    if config.epochs <= 0:
        raise ValueError("--epochs must be at least 1.")
    if config.fine_tune_epochs < 0:
        raise ValueError("--fine-tune-epochs cannot be negative.")
    if config.batch_size <= 0:
        raise ValueError("--batch-size must be at least 1.")

    set_reproducible_seed(config.seed)

    train_raw, val_raw, class_names = load_datasets(
        config.dataset_dir,
        image_size=IMAGE_SIZE,
        batch_size=config.batch_size,
        seed=config.seed,
    )
    _save_json(class_names, config.class_names_path)
    print(f"Saved {len(class_names)} class names to '{config.class_names_path}'.")

    augmentation_layer = build_augmentation_layer(config.seed)
    train_ds, val_ds = prepare_pipelines(train_raw, val_raw, augmentation_layer)

    model, base_model = build_mobilenetv2_model(
        num_classes=len(class_names),
        image_size=IMAGE_SIZE,
        dropout_rate=config.dropout_rate,
        weights=config.weights,
    )
    _compile_model(model, config.learning_rate)

    print(
        f"\n--- Stage 1: Training classification head (frozen MobileNetV2 base, "
        f"epochs={config.epochs}, lr={config.learning_rate}) ---"
    )
    stage1_callbacks = build_callbacks(
        model_path=config.model_path,
        patience=config.patience,
    )
    history_stage1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=config.epochs,
        callbacks=stage1_callbacks,
        verbose=1,
    )

    stage1_val_accs = history_stage1.history.get("val_accuracy", [])
    best_val_accuracy = float(max(stage1_val_accs)) if stage1_val_accs else 0.0

    stage2_history_dict: dict[str, list[float]] = {}
    unfrozen_layers = 0

    if config.fine_tune_epochs > 0:
        # Start Stage 2 from the best Stage 1 checkpoint saved on disk.
        best_stage1_model = tf.keras.models.load_model(config.model_path)
        model.set_weights(best_stage1_model.get_weights())

        unfrozen_layers = unfreeze_for_fine_tuning(base_model, config.fine_tune_at)
        _compile_model(model, config.fine_tune_lr)

        completed_epochs = len(history_stage1.epoch)
        total_epochs = completed_epochs + config.fine_tune_epochs

        print(
            f"\n--- Stage 2: Fine-tuning MobileNetV2 (unfrozen_layers={unfrozen_layers}, "
            f"fine_tune_at={config.fine_tune_at}, epochs={config.fine_tune_epochs}, "
            f"lr={config.fine_tune_lr}) ---"
        )
        stage2_callbacks = build_callbacks(
            model_path=config.model_path,
            patience=config.patience,
            initial_value_threshold=best_val_accuracy,
        )
        history_stage2 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=total_epochs,
            initial_epoch=completed_epochs,
            callbacks=stage2_callbacks,
            verbose=1,
        )
        stage2_history_dict = _serialize_history(history_stage2)
        stage2_val_accs = stage2_history_dict.get("val_accuracy", [])
        if stage2_val_accs:
            best_val_accuracy = max(best_val_accuracy, max(stage2_val_accs))

    summary = {
        "config": {
            key: str(val) if isinstance(val, Path) else val
            for key, val in asdict(config).items()
        },
        "num_classes": len(class_names),
        "class_names": class_names,
        "best_val_accuracy": best_val_accuracy,
        "fine_tune_unfrozen_layers": unfrozen_layers,
        "stage1_history": _serialize_history(history_stage1),
        "stage2_history": stage2_history_dict,
    }
    _save_json(summary, config.history_path)
    print(
        f"\nTraining complete. Best validation accuracy: {best_val_accuracy:.4f}\n"
        f"Best Keras model saved to: '{config.model_path}'\n"
        f"Class names saved to:      '{config.class_names_path}'\n"
        f"Training history saved to: '{config.history_path}'"
    )
    return summary


def _parse_weights_arg(raw_value: str) -> str | None:
    if raw_value.strip().lower() in {"none", "null", ""}:
        return None
    return raw_value


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Train PlantCare AI MobileNetV2 classifier on processed leaf splits."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=DEFAULT_DATASET_DIR,
        help=f"Processed dataset directory containing train/ and val/ (default: {DEFAULT_DATASET_DIR})",
    )
    parser.add_argument(
        "--model-path",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help=f"Destination .keras model path (default: {DEFAULT_MODEL_PATH})",
    )
    parser.add_argument(
        "--class-names-path",
        type=Path,
        default=DEFAULT_CLASS_NAMES_PATH,
        help=f"Destination class_names.json path (default: {DEFAULT_CLASS_NAMES_PATH})",
    )
    parser.add_argument(
        "--history-path",
        type=Path,
        default=DEFAULT_HISTORY_PATH,
        help=f"Destination training_history.json path (default: {DEFAULT_HISTORY_PATH})",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=10,
        help="Number of Stage 1 epochs with frozen base (default: 10)",
    )
    parser.add_argument(
        "--fine-tune-epochs",
        type=int,
        default=5,
        help="Number of Stage 2 fine-tuning epochs; set 0 to disable (default: 5)",
    )
    parser.add_argument(
        "--fine-tune-at",
        type=int,
        default=100,
        help="MobileNetV2 base layer index from which to unfreeze during fine-tuning (default: 100)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Training and validation batch size (default: 32)",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=1e-3,
        help="Stage 1 Adam learning rate (default: 1e-3)",
    )
    parser.add_argument(
        "--fine-tune-lr",
        type=float,
        default=1e-5,
        help="Stage 2 fine-tuning Adam learning rate (default: 1e-5)",
    )
    parser.add_argument(
        "--dropout",
        type=float,
        default=0.3,
        help="Dropout probability before final classification layer (default: 0.3)",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=4,
        help="EarlyStopping patience on val_loss (default: 4)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for shuffling and augmentation (default: 42)",
    )
    parser.add_argument(
        "--weights",
        type=str,
        default="imagenet",
        help="Pretrained weights ('imagenet' or 'none', default: 'imagenet')",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = _build_arg_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    config = TrainConfig(
        dataset_dir=args.dataset_dir.resolve(),
        model_path=args.model_path.resolve(),
        class_names_path=args.class_names_path.resolve(),
        history_path=args.history_path.resolve(),
        epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        fine_tune_at=args.fine_tune_at,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        fine_tune_lr=args.fine_tune_lr,
        dropout_rate=args.dropout,
        patience=args.patience,
        seed=args.seed,
        weights=_parse_weights_arg(args.weights),
    )

    try:
        train_model(config)
        return 0
    except Exception as exc:
        print(f"Training failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

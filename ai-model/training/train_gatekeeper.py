"""Train a 4-Class MobileNetV2 Gatekeeper Classifier for PlantCare AI.

Pipeline:
1. Load 224x224 gatekeeper dataset from ai-model/dataset/gatekeeper/train and val.
2. Save exact class index mapping to ai-model/trained_model/gatekeeper_class_names.json.
3. MobileNetV2 base (ImageNet weights, frozen) + GlobalAveragePooling2D + Dropout(0.3) + Dense(4, softmax).
4. Categorical cross-entropy with Adam optimizer (lr=1e-3).
5. Train for up to 8 epochs with ModelCheckpoint saving to ai-model/trained_model/plant_gatekeeper_model.keras.
"""

import os
import json
import random
import time
import numpy as np
import tensorflow as tf

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.keras.utils.set_random_seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset", "gatekeeper")
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")

MODEL_SAVE_PATH = os.path.join(BASE_DIR, "trained_model", "plant_gatekeeper_model.keras")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "trained_model", "gatekeeper_class_names.json")
HISTORY_SAVE_PATH = os.path.join(BASE_DIR, "trained_model", "gatekeeper_training_history.json")

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 8
LEARNING_RATE = 1e-3

print("=" * 65)
print("PlantCare AI - Training 4-Class MobileNetV2 Gatekeeper")
print("=" * 65)
print(f"TensorFlow Version: {tf.__version__}")
print(f"Dataset Directory:  {DATASET_DIR}")
print(f"Model Save Path:    {MODEL_SAVE_PATH}")
print("-" * 65)

# 1. Load Datasets
print("Loading datasets...")
train_ds = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    labels="inferred",
    label_mode="categorical",
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=True,
    seed=RANDOM_SEED,
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    labels="inferred",
    label_mode="categorical",
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False,
)

class_names = train_ds.class_names
print(f"Classes ({len(class_names)}): {class_names}")

# Save class names mapping
class_mapping = {str(i): name for i, name in enumerate(class_names)}
with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as f:
    json.dump(class_mapping, f, indent=2)
print(f"Saved class index mapping to: {CLASS_NAMES_PATH}")

# 2. Data Augmentation & Preprocessing
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.15),
    tf.keras.layers.RandomZoom(0.1),
    tf.keras.layers.RandomContrast(0.1),
], name="gatekeeper_augmentation")

AUTOTUNE = tf.data.AUTOTUNE

train_ds = (
    train_ds
    .map(lambda x, y: (data_augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)
    .map(lambda x, y: (tf.keras.applications.mobilenet_v2.preprocess_input(x), y), num_parallel_calls=AUTOTUNE)
    .prefetch(AUTOTUNE)
)

val_ds = (
    val_ds
    .map(lambda x, y: (tf.keras.applications.mobilenet_v2.preprocess_input(x), y), num_parallel_calls=AUTOTUNE)
    .prefetch(AUTOTUNE)
)

# 3. Model Architecture
print("\nBuilding MobileNetV2 Gatekeeper Architecture...")
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet",
)
base_model.trainable = False  # Freeze ImageNet feature extractor

inputs = tf.keras.Input(shape=(224, 224, 3), name="input_image")
x = base_model(inputs, training=False)
x = tf.keras.layers.GlobalAveragePooling2D(name="avg_pool")(x)
x = tf.keras.layers.BatchNormalization(name="batch_norm")(x)
x = tf.keras.layers.Dropout(0.3, name="dropout")(x)
outputs = tf.keras.layers.Dense(len(class_names), activation="softmax", name="gatekeeper_output")(x)

model = tf.keras.Model(inputs=inputs, outputs=outputs, name="PlantGatekeeper_MobileNetV2")

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

model.summary(show_trainable=True)

# 4. Training Callbacks
callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        filepath=MODEL_SAVE_PATH,
        monitor="val_accuracy",
        mode="max",
        save_best_only=True,
        verbose=1,
    ),
    tf.keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        mode="max",
        patience=3,
        restore_best_weights=True,
        verbose=1,
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=1e-5,
        verbose=1,
    )
]

# 5. Execute Training
print("\n" + "=" * 65)
print("Starting Transfer Learning...")
print("=" * 65)
t_start = time.time()

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1,
)

training_duration = time.time() - t_start
print(f"\nTraining completed in {training_duration:.1f} seconds ({training_duration/60:.1f} minutes).")

# 6. Final Evaluation
print("\n" + "=" * 65)
print("Final Validation Evaluation:")
print("=" * 65)
best_model = tf.keras.models.load_model(MODEL_SAVE_PATH)
val_loss, val_acc = best_model.evaluate(val_ds, verbose=0)
print(f"Validation Loss:     {val_loss:.4f}")
print(f"Validation Accuracy: {val_acc*100:.2f}%")

# Save history
history_dict = {
    "training_time_seconds": round(training_duration, 1),
    "final_val_accuracy": round(val_acc, 4),
    "final_val_loss": round(val_loss, 4),
    "epochs_trained": len(history.history["loss"]),
    "history": {k: [round(float(v), 4) for v in vals] for k, vals in history.history.items()}
}
with open(HISTORY_SAVE_PATH, "w", encoding="utf-8") as f:
    json.dump(history_dict, f, indent=2)

file_size_mb = os.path.getsize(MODEL_SAVE_PATH) / (1024 * 1024)
print(f"\nBest model saved to: {MODEL_SAVE_PATH} ({file_size_mb:.2f} MB)")
print("Gatekeeper training pipeline finished successfully!")
print("=" * 65)

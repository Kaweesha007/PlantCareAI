"""Test the trained MobileNetV2 Gatekeeper on the 19 PoC images."""

import os
import glob
import json
import time
import numpy as np
import tensorflow as tf
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "trained_model", "plant_gatekeeper_model.keras")
LABELS_PATH = os.path.join(BASE_DIR, "trained_model", "gatekeeper_class_names.json")

POC_DIR = r"C:\Users\User\.gemini\antigravity\brain\924e5471-2f9e-4e2f-aa4d-67e64a72cf99\scratch\bioclip_poc"
SUPPORTED_DIR = os.path.join(POC_DIR, "supported")
UNSUPPORTED_DIR = os.path.join(POC_DIR, "unsupported")

print("=" * 65)
print("PlantCare AI - Evaluating MobileNetV2 Gatekeeper on PoC Images")
print("=" * 65)

# Load Model & Labels
model = tf.keras.models.load_model(MODEL_PATH)
with open(LABELS_PATH, "r", encoding="utf-8") as f:
    class_mapping = json.load(f)
classes = [class_mapping[str(i)] for i in range(len(class_mapping))]
print(f"Loaded Gatekeeper Model: {MODEL_PATH}")
print(f"Gatekeeper Classes:      {classes}")
print("-" * 65)

def preprocess_image(path):
    img = Image.open(path).convert("RGB").resize((224, 224), Image.Resampling.LANCZOS)
    arr = np.asarray(img, dtype=np.float32)
    norm = (arr / 127.5) - 1.0  # MobilenetV2 scaling
    return np.expand_dims(norm, axis=0)

CONFIDENCE_THRESHOLD = 0.65

def evaluate_image(path, expected_crop, is_supported):
    tensor = preprocess_image(path)
    t0 = time.time()
    preds = model.predict(tensor, verbose=0)[0]
    inf_ms = (time.time() - t0) * 1000
    
    top_idx = int(np.argmax(preds))
    top_conf = float(preds[top_idx])
    pred_class = classes[top_idx]
    
    # Gate decision
    if top_conf < CONFIDENCE_THRESHOLD:
        gate = "UNCERTAIN"
    elif pred_class == "unsupported":
        gate = "UNSUPPORTED"
    else:
        gate = "SUPPORTED"
        
    expected_gate = "SUPPORTED" if is_supported else "UNSUPPORTED"
    correct = (gate == expected_gate)
    
    return {
        "filename": os.path.basename(path),
        "ground_truth": expected_crop,
        "is_supported": is_supported,
        "predicted_class": pred_class,
        "confidence": top_conf,
        "gate_decision": gate,
        "correct": correct,
        "inference_ms": round(inf_ms, 1)
    }

supported_files = sorted(glob.glob(os.path.join(SUPPORTED_DIR, "*.jpg")))
unsupported_files = sorted([f for f in glob.glob(os.path.join(UNSUPPORTED_DIR, "*.jpg")) if not f.endswith("_metadata.json")])

results = []

print("\n--- Testing Supported Images (PlantVillage) ---")
for f in supported_files:
    fname = os.path.basename(f).lower()
    gt = "Tomato" if "tomato" in fname else ("Potato" if "potato" in fname else "Bell Pepper")
    r = evaluate_image(f, gt, True)
    results.append(r)
    mark = "PASS" if r["correct"] else "FAIL"
    print(f"[{mark}] {r['filename']:<32} -> Pred: {r['predicted_class']:<12} ({r['confidence']*100:5.1f}%) | Gate: {r['gate_decision']} ({r['inference_ms']}ms)")

print("\n--- Testing Unsupported Images (iNaturalist) ---")
for f in unsupported_files:
    fname = os.path.basename(f).lower()
    if "cucumber" in fname: gt = "Cucumber"
    elif "mango" in fname: gt = "Mango"
    elif "banana" in fname: gt = "Banana"
    elif "brinjal" in fname: gt = "Brinjal"
    elif "chilli" in fname: gt = "Chilli"
    else: gt = "Other"
    
    r = evaluate_image(f, gt, False)
    results.append(r)
    mark = "PASS" if r["correct"] else "FAIL"
    print(f"[{mark}] {r['filename']:<36} -> Pred: {r['predicted_class']:<12} ({r['confidence']*100:5.1f}%) | Gate: {r['gate_decision']} ({r['inference_ms']}ms)")

correct_n = sum(1 for r in results if r["correct"])
avg_latency = sum(r["inference_ms"] for r in results) / len(results)

print("\n" + "=" * 65)
print(f"MobileNetV2 Gatekeeper Accuracy: {correct_n}/{len(results)} ({correct_n/len(results)*100:.1f}%)")
print(f"Average CPU Inference Latency:   {avg_latency:.1f} ms per image")
print("=" * 65)

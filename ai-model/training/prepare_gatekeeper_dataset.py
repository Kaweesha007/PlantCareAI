"""Fast dataset preparation script for PlantCare AI 4-Class Plant Gatekeeper.
Uses multi-threaded image downloading for high throughput.
"""

import os
import glob
import random
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import requests

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "dataset", "raw")
GATEKEEPER_DIR = os.path.join(BASE_DIR, "dataset", "gatekeeper")
TRAIN_DIR = os.path.join(GATEKEEPER_DIR, "train")
VAL_DIR = os.path.join(GATEKEEPER_DIR, "val")

CLASSES = ["bell_pepper", "potato", "tomato", "unsupported"]
TARGET_TOTAL_PER_CLASS = 400
TRAIN_RATIO = 0.8
VAL_RATIO = 0.2

for c in CLASSES:
    os.makedirs(os.path.join(TRAIN_DIR, c), exist_ok=True)
    os.makedirs(os.path.join(VAL_DIR, c), exist_ok=True)

# 1. Sample Supported Images from raw dataset if not already populated
def populate_supported():
    for crop in ["bell_pepper", "potato", "tomato"]:
        n_train = len(glob.glob(os.path.join(TRAIN_DIR, crop, "*.*")))
        n_val = len(glob.glob(os.path.join(VAL_DIR, crop, "*.*")))
        if n_train >= 320 and n_val >= 80:
            print(f"[{crop}] Already populated ({n_train} train, {n_val} val). Skipping.")
            continue
            
        print(f"[{crop}] Populating from raw dataset...")
        if crop == "bell_pepper":
            files = (
                glob.glob(os.path.join(RAW_DIR, "Pepper__bell___healthy", "*.*"))[:200] +
                glob.glob(os.path.join(RAW_DIR, "Pepper__bell___Bacterial_spot", "*.*"))[:200]
            )
        elif crop == "potato":
            files = (
                glob.glob(os.path.join(RAW_DIR, "Potato___healthy", "*.*")) +
                glob.glob(os.path.join(RAW_DIR, "Potato___Early_blight", "*.*"))[:130] +
                glob.glob(os.path.join(RAW_DIR, "Potato___Late_blight", "*.*"))[:130]
            )
        else: # tomato
            tomato_dirs = [d for d in os.listdir(RAW_DIR) if d.startswith("Tomato")]
            files = []
            for td in tomato_dirs:
                files.extend(glob.glob(os.path.join(RAW_DIR, td, "*.*"))[:40])
                
        random.shuffle(files)
        selected = files[:TARGET_TOTAL_PER_CLASS]
        train_count = int(TARGET_TOTAL_PER_CLASS * TRAIN_RATIO)
        for i, src in enumerate(selected):
            split = "train" if i < train_count else "val"
            dest = os.path.join(GATEKEEPER_DIR, split, crop, f"{crop}_{i:04d}{os.path.splitext(src)[1]}")
            shutil.copy2(src, dest)
        print(f"[{crop}] Populated {train_count} train and {len(selected)-train_count} val images.")

populate_supported()

# 2. Collect Unsupported Images (40 per species * 10 species = 400 images)
UNSUPPORTED_TAXA = [
    ("Solanum melongena", "brinjal", 40),
    ("Capsicum frutescens", "chilli", 40),
    ("Cucumis sativus", "cucumber", 40),
    ("Mangifera indica", "mango", 40),
    ("Musa acuminata", "banana", 40),
    ("Malus domestica", "apple", 40),
    ("Zea mays", "corn", 40),
    ("Vitis vinifera", "grape", 40),
    ("Oryza sativa", "rice", 40),
    ("Taraxacum officinale", "wild_foliage", 40)
]

TEMP_DIR = os.path.join(GATEKEEPER_DIR, "_temp_unsupported")
os.makedirs(TEMP_DIR, exist_ok=True)

def fetch_taxa_photo_urls(taxon_name, label, count):
    url = "https://api.inaturalist.org/v1/observations"
    params = {
        "taxon_name": taxon_name,
        "photos": "true",
        "quality_grade": "research",
        "per_page": count + 15
    }
    headers = {"User-Agent": "PlantCareAI-Academic/1.0"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=12)
        if r.status_code == 200:
            results = r.json().get("results", [])
            items = []
            for obs in results:
                photos = obs.get("photos", [])
                if photos and photos[0].get("url"):
                    img_url = photos[0]["url"].replace("square.", "medium.")
                    obs_id = obs.get("id")
                    dest = os.path.join(TEMP_DIR, f"{label}_{obs_id}.jpg")
                    items.append((img_url, dest))
                if len(items) >= count:
                    break
            return items
    except Exception as e:
        print(f"[{label}] Query failed: {e}")
    return []

def download_image_task(item):
    img_url, dest = item
    if os.path.exists(dest) and os.path.getsize(dest) > 3000:
        return dest
    try:
        r = requests.get(img_url, timeout=12)
        if r.status_code == 200 and len(r.content) > 3000:
            with open(dest, "wb") as f:
                f.write(r.content)
            with Image.open(dest) as im:
                im.verify()
            return dest
    except Exception:
        if os.path.exists(dest):
            try: os.remove(dest)
            except Exception: pass
    return None

print("\n--- Querying iNaturalist Photo URLs for Unsupported Species ---")
all_download_items = []
for taxon, label, target_n in UNSUPPORTED_TAXA:
    items = fetch_taxa_photo_urls(taxon, label, target_n)
    all_download_items.extend(items)
    print(f"[{label:<14}] Found {len(items)} photo URLs.")
    time.sleep(0.3)

print(f"\nDownloading {len(all_download_items)} unsupported leaf images using 10 worker threads...")
t0 = time.time()
valid_unsupported = []
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(download_image_task, item) for item in all_download_items]
    for future in as_completed(futures):
        res = future.result()
        if res:
            valid_unsupported.append(res)

print(f"Downloaded and verified {len(valid_unsupported)} unsupported images in {time.time()-t0:.1f}s!")

# Distribute into train/val
random.shuffle(valid_unsupported)
train_n = int(len(valid_unsupported) * TRAIN_RATIO)

train_unsupported_dir = os.path.join(TRAIN_DIR, "unsupported")
val_unsupported_dir = os.path.join(VAL_DIR, "unsupported")

for i, src in enumerate(valid_unsupported):
    split_dir = train_unsupported_dir if i < train_n else val_unsupported_dir
    dest = os.path.join(split_dir, os.path.basename(src))
    shutil.copy2(src, dest)

if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR, ignore_errors=True)

# 3. Final Summary
print("\n" + "=" * 60)
print("Gatekeeper Dataset Distribution Summary:")
print("=" * 60)
for split in ["train", "val"]:
    print(f"\n[{split.upper()} SET]")
    for c in CLASSES:
        n = len(glob.glob(os.path.join(GATEKEEPER_DIR, split, c, "*.*")))
        print(f"  {c:<15}: {n} images")

print("\nDataset preparation completed successfully!")
print("=" * 60)

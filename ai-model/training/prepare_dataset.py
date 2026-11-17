"""Dataset preparation pipeline for PlantCare AI.

Reads class-organized images from ``ai-model/dataset/raw``, validates image
integrity, removes duplicate images before splitting to prevent data leakage,
resizes images to 224x224 RGB, performs a reproducible stratified 70/15/15 split
into train/val/test folders under ``ai-model/dataset/processed``, and writes
dataset summary reports alongside preserved class labels.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import random
import shutil
import sys
from typing import Iterable

from PIL import Image, ImageOps, UnidentifiedImageError

AI_MODEL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_RAW_DIR = AI_MODEL_DIR / "dataset" / "raw"
DEFAULT_PROCESSED_DIR = AI_MODEL_DIR / "dataset" / "processed"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG"}
TARGET_SIZE = (224, 224)
DEFAULT_SEED = 42
DEFAULT_RATIOS = (0.70, 0.15, 0.15)
SPLIT_NAMES = ("train", "val", "test")


@dataclass(frozen=True)
class ValidatedRecord:
    """Metadata for a single validated, deduplicated source image."""

    source_path: Path
    class_label: str
    content_hash: str
    output_filename: str


@dataclass(frozen=True)
class SkippedFile:
    """Details about a raw file excluded during validation or deduplication."""

    path: str
    class_label: str
    reason: str


@dataclass(frozen=True)
class SaveTask:
    """Work item for resizing and writing an image into a split folder."""

    source_path: Path
    destination_path: Path
    class_label: str
    split_name: str


def _parse_class_display(raw_label: str) -> tuple[str, str]:
    """Derive readable plant and disease names while keeping raw_label exact."""
    if "___" in raw_label:
        plant_part, disease_part = raw_label.split("___", 1)
    elif "__" in raw_label:
        plant_part, disease_part = raw_label.split("__", 1)
    elif "_" in raw_label:
        plant_part, disease_part = raw_label.split("_", 1)
    else:
        return raw_label, raw_label

    plant_name = " ".join(plant_part.replace("_", " ").split())
    disease_name = " ".join(disease_part.replace("_", " ").split())
    return plant_name, disease_name


def _validate_ratios(train_ratio: float, val_ratio: float, test_ratio: float) -> None:
    ratios = (train_ratio, val_ratio, test_ratio)
    if any(r <= 0.0 for r in ratios):
        raise ValueError("All split ratios (train, val, test) must be greater than 0.")
    total = sum(ratios)
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"Split ratios must sum to 1.0 (got {total:.6f}).")


def _compute_pixel_hash(rgb_image: Image.Image) -> str:
    """Hash decoded RGB pixel dimensions + bytes to catch exact duplicates across formats."""
    hasher = hashlib.sha256()
    hasher.update(f"{rgb_image.width}x{rgb_image.height}:".encode("ascii"))
    hasher.update(rgb_image.tobytes())
    return hasher.hexdigest()


def _validate_single_image(file_path: Path) -> tuple[str | None, str | None]:
    """Verify extension, size, and Pillow decodability; return (pixel_hash, error_reason)."""
    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        return None, f"Unsupported extension '{file_path.suffix or 'none'}'"

    try:
        if file_path.stat().st_size == 0:
            return None, "Empty file (0 bytes)"
    except OSError as exc:
        return None, f"Unable to stat file: {exc}"

    try:
        with Image.open(file_path) as probe:
            img_format = (probe.format or "").upper()
            if img_format not in ALLOWED_PIL_FORMATS:
                return None, f"Unsupported image format '{img_format or 'unknown'}'"
            probe.verify()

        with Image.open(file_path) as decoded:
            transposed = ImageOps.exif_transpose(decoded)
            rgb = transposed.convert("RGB")
            rgb.load()
            if rgb.width <= 0 or rgb.height <= 0:
                return None, "Image has non-positive dimensions"
            return _compute_pixel_hash(rgb), None
    except Image.DecompressionBombError:
        return None, "Image exceeds safe pixel limit"
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        return None, f"Corrupted or unreadable image: {exc}"


def _discover_class_directories(raw_dir: Path) -> list[Path]:
    if not raw_dir.exists() or not raw_dir.is_dir():
        raise FileNotFoundError(f"Raw dataset directory does not exist: '{raw_dir}'")

    class_dirs = sorted(
        (entry for entry in raw_dir.iterdir() if entry.is_dir() and not entry.name.startswith(".")),
        key=lambda p: p.name,
    )
    if not class_dirs:
        raise RuntimeError(f"No disease class folders found in '{raw_dir}'.")
    return class_dirs


def _validate_and_deduplicate_class(
    class_dir: Path,
    *,
    max_workers: int,
) -> tuple[list[tuple[Path, str]], list[SkippedFile], int]:
    """Validate all files in a class directory deterministically and deduplicate in-class."""
    files = sorted(
        (p for p in class_dir.rglob("*") if p.is_file()),
        key=lambda p: p.relative_to(class_dir).as_posix(),
    )

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        results = list(pool.map(_validate_single_image, files))

    seen_in_class: set[str] = set()
    valid_items: list[tuple[Path, str]] = []
    skipped: list[SkippedFile] = []
    within_class_duplicates = 0

    for file_path, (pixel_hash, error_reason) in zip(files, results):
        if error_reason is not None or pixel_hash is None:
            skipped.append(
                SkippedFile(
                    path=str(file_path),
                    class_label=class_dir.name,
                    reason=error_reason or "Unknown validation error",
                )
            )
            continue

        if pixel_hash in seen_in_class:
            within_class_duplicates += 1
            skipped.append(
                SkippedFile(
                    path=str(file_path),
                    class_label=class_dir.name,
                    reason="Duplicate image within class (removed to prevent split leakage)",
                )
            )
            continue

        seen_in_class.add(pixel_hash)
        valid_items.append((file_path, pixel_hash))

    return valid_items, skipped, within_class_duplicates


def _compute_split_counts(total: int, ratios: tuple[float, float, float]) -> tuple[int, int, int]:
    """Compute (train, val, test) counts summing to total without losing samples."""
    if total < 3:
        raise ValueError(
            f"Each class needs at least 3 unique valid images to split into train/val/test (got {total})."
        )

    train_ratio, val_ratio, _ = ratios
    n_train = int(round(total * train_ratio))
    n_val = int(round(total * val_ratio))

    n_train = max(1, min(n_train, total - 2))
    n_val = max(1, min(n_val, total - n_train - 1))
    n_test = total - n_train - n_val
    return n_train, n_val, n_test


def _build_unique_output_filenames(
    items: list[tuple[Path, str]],
    *,
    class_label: str,
) -> list[ValidatedRecord]:
    """Assign collision-free .jpg output filenames while keeping original stems readable."""
    used_names: set[str] = set()
    records: list[ValidatedRecord] = []

    for source_path, pixel_hash in items:
        base_stem = source_path.stem
        candidate = f"{base_stem}.jpg"
        if candidate.lower() in used_names:
            candidate = f"{base_stem}_{pixel_hash[:8]}.jpg"

        counter = 1
        while candidate.lower() in used_names:
            candidate = f"{base_stem}_{pixel_hash[:8]}_{counter}.jpg"
            counter += 1

        used_names.add(candidate.lower())
        records.append(
            ValidatedRecord(
                source_path=source_path,
                class_label=class_label,
                content_hash=pixel_hash,
                output_filename=candidate,
            )
        )

    return records


def _resize_and_save_image(task: SaveTask, target_size: tuple[int, int]) -> None:
    """Read source image, convert to RGB, resize to 224x224, and write JPEG output."""
    with Image.open(task.source_path) as img:
        transposed = ImageOps.exif_transpose(img)
        rgb = transposed.convert("RGB")
        resized = rgb.resize(target_size, resample=Image.Resampling.LANCZOS)
        task.destination_path.parent.mkdir(parents=True, exist_ok=True)
        resized.save(task.destination_path, format="JPEG", quality=95)


def _prepare_output_directory(processed_dir: Path, overwrite: bool) -> None:
    """Ensure processed output directories are clean so stale files cannot leak across runs."""
    existing_splits = [processed_dir / split for split in SPLIT_NAMES if (processed_dir / split).exists()]
    has_existing_files = any(any(split_dir.rglob("*")) for split_dir in existing_splits)

    if has_existing_files and not overwrite:
        raise FileExistsError(
            f"Processed directory '{processed_dir}' already contains split data. "
            "Re-run with --overwrite to replace it cleanly without stale-file leakage."
        )

    if overwrite:
        for split in SPLIT_NAMES:
            split_path = processed_dir / split
            if split_path.exists():
                shutil.rmtree(split_path)

    processed_dir.mkdir(parents=True, exist_ok=True)
    for split in SPLIT_NAMES:
        (processed_dir / split).mkdir(parents=True, exist_ok=True)


def _write_summary_files(
    processed_dir: Path,
    *,
    class_labels: list[str],
    summary_payload: dict,
) -> None:
    """Persist preserved class labels and JSON/Markdown dataset summaries."""
    labels_payload = []
    for idx, raw_label in enumerate(class_labels):
        plant_name, disease_name = _parse_class_display(raw_label)
        labels_payload.append(
            {
                "index": idx,
                "label": raw_label,
                "plant_name": plant_name,
                "disease_name": disease_name,
            }
        )

    with (processed_dir / "class_labels.json").open("w", encoding="utf-8") as handle:
        json.dump(labels_payload, handle, indent=2)

    with (processed_dir / "dataset_summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary_payload, handle, indent=2)

    lines = [
        "# PlantCare AI Processed Dataset Summary",
        "",
        f"- **Generated (UTC):** {summary_payload['generated_at']}",
        f"- **Random Seed:** `{summary_payload['seed']}`",
        f"- **Image Size:** `{summary_payload['target_size'][0]} x {summary_payload['target_size'][1]}` RGB",
        f"- **Split Ratios:** Train `{summary_payload['ratios']['train']:.0%}` / "
        f"Val `{summary_payload['ratios']['val']:.0%}` / "
        f"Test `{summary_payload['ratios']['test']:.0%}`",
        f"- **Zero Split Leakage Verified:** `{summary_payload['leakage_check']['passed']}`",
        "",
        "| Class Label | Raw Files | Invalid / Skipped | Duplicates Removed | Unique Valid | Train | Val | Test |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for row in summary_payload["classes"]:
        lines.append(
            f"| `{row['class_label']}` | {row['raw_count']} | {row['invalid_count']} | "
            f"{row['duplicate_count']} | {row['valid_unique_count']} | "
            f"{row['train_count']} | {row['val_count']} | {row['test_count']} |"
        )

    totals = summary_payload["totals"]
    lines.append(
        f"| **TOTAL ({len(summary_payload['classes'])} classes)** | **{totals['raw_count']}** | "
        f"**{totals['invalid_count']}** | **{totals['duplicate_count']}** | "
        f"**{totals['valid_unique_count']}** | **{totals['train_count']}** | "
        f"**{totals['val_count']}** | **{totals['test_count']}** |"
    )
    lines.append("")

    with (processed_dir / "dataset_summary.md").open("w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def _print_console_summary(summary_payload: dict) -> None:
    """Print an aligned table of per-class counts and leakage checks."""
    header = (
        f"{'Class Label':<44} {'Raw':>6} {'Skip':>5} {'Dup':>5} "
        f"{'Valid':>6} {'Train':>6} {'Val':>5} {'Test':>5}"
    )
    print("\n" + header)
    print("-" * len(header))
    for row in summary_payload["classes"]:
        print(
            f"{row['class_label']:<44} {row['raw_count']:>6} {row['invalid_count']:>5} "
            f"{row['duplicate_count']:>5} {row['valid_unique_count']:>6} "
            f"{row['train_count']:>6} {row['val_count']:>5} {row['test_count']:>5}"
        )

    totals = summary_payload["totals"]
    print("-" * len(header))
    print(
        f"{'TOTAL':<44} {totals['raw_count']:>6} {totals['invalid_count']:>5} "
        f"{totals['duplicate_count']:>5} {totals['valid_unique_count']:>6} "
        f"{totals['train_count']:>6} {totals['val_count']:>5} {totals['test_count']:>5}"
    )
    print(
        f"\nLeakage check passed: {summary_payload['leakage_check']['passed']} "
        f"(disjoint hashes across train/val/test verified)"
    )


def prepare_dataset(
    *,
    raw_dir: Path,
    processed_dir: Path,
    seed: int = DEFAULT_SEED,
    ratios: tuple[float, float, float] = DEFAULT_RATIOS,
    target_size: tuple[int, int] = TARGET_SIZE,
    overwrite: bool = False,
    workers: int | None = None,
) -> dict:
    """Run validation, deduplication, stratified splitting, resizing, and summary generation."""
    _validate_ratios(*ratios)
    max_workers = workers or min(8, (os.cpu_count() or 4))

    class_dirs = _discover_class_directories(raw_dir)
    _prepare_output_directory(processed_dir, overwrite=overwrite)

    print(f"Scanning {len(class_dirs)} class folders from '{raw_dir}'...")
    class_valid_items: dict[str, list[tuple[Path, str]]] = {}
    class_raw_counts: dict[str, int] = {}
    class_invalid_counts: dict[str, int] = {}
    class_dup_counts: dict[str, int] = {}
    all_skipped: list[SkippedFile] = []
    hash_to_classes: dict[str, set[str]] = defaultdict(set)

    for class_dir in class_dirs:
        raw_file_count = sum(1 for p in class_dir.rglob("*") if p.is_file())
        class_raw_counts[class_dir.name] = raw_file_count

        valid_items, skipped, dup_count = _validate_and_deduplicate_class(
            class_dir,
            max_workers=max_workers,
        )
        class_valid_items[class_dir.name] = valid_items
        class_dup_counts[class_dir.name] = dup_count
        class_invalid_counts[class_dir.name] = len(skipped) - dup_count
        all_skipped.extend(skipped)

        for _, pixel_hash in valid_items:
            hash_to_classes[pixel_hash].add(class_dir.name)

    # Exclude cross-class identical images so conflicting labels never leak across splits.
    cross_class_hashes = {
        pixel_hash for pixel_hash, classes in hash_to_classes.items() if len(classes) > 1
    }

    rng = random.Random(seed)
    save_tasks: list[SaveTask] = []
    split_hashes: dict[str, set[str]] = {split: set() for split in SPLIT_NAMES}
    class_summaries: list[dict] = []

    for class_dir in class_dirs:
        label = class_dir.name
        filtered_items: list[tuple[Path, str]] = []
        for path, pixel_hash in class_valid_items[label]:
            if pixel_hash in cross_class_hashes:
                class_dup_counts[label] += 1
                all_skipped.append(
                    SkippedFile(
                        path=str(path),
                        class_label=label,
                        reason="Cross-class identical image removed to prevent label leakage",
                    )
                )
                continue
            filtered_items.append((path, pixel_hash))

        records = _build_unique_output_filenames(filtered_items, class_label=label)
        rng.shuffle(records)

        n_train, n_val, n_test = _compute_split_counts(len(records), ratios)
        split_slices = {
            "train": records[:n_train],
            "val": records[n_train : n_train + n_val],
            "test": records[n_train + n_val :],
        }

        for split_name, split_records in split_slices.items():
            for record in split_records:
                split_hashes[split_name].add(record.content_hash)
                destination = processed_dir / split_name / label / record.output_filename
                save_tasks.append(
                    SaveTask(
                        source_path=record.source_path,
                        destination_path=destination,
                        class_label=label,
                        split_name=split_name,
                    )
                )

        class_summaries.append(
            {
                "class_label": label,
                "raw_count": class_raw_counts[label],
                "invalid_count": class_invalid_counts[label],
                "duplicate_count": class_dup_counts[label],
                "valid_unique_count": len(records),
                "train_count": n_train,
                "val_count": n_val,
                "test_count": n_test,
            }
        )

    # Verify zero content-hash overlap across train, val, and test before writing output.
    train_val_overlap = len(split_hashes["train"] & split_hashes["val"])
    train_test_overlap = len(split_hashes["train"] & split_hashes["test"])
    val_test_overlap = len(split_hashes["val"] & split_hashes["test"])
    leakage_passed = (
        train_val_overlap == 0 and train_test_overlap == 0 and val_test_overlap == 0
    )
    if not leakage_passed:
        raise RuntimeError("Data leakage check failed: duplicate hashes overlap across splits.")

    print(
        f"Resizing and writing {len(save_tasks)} validated images "
        f"({target_size[0]}x{target_size[1]}) to '{processed_dir}'..."
    )
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        list(pool.map(lambda task: _resize_and_save_image(task, target_size), save_tasks))

    totals = {
        key: sum(row[key] for row in class_summaries)
        for key in (
            "raw_count",
            "invalid_count",
            "duplicate_count",
            "valid_unique_count",
            "train_count",
            "val_count",
            "test_count",
        )
    }

    summary_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "raw_dir": str(raw_dir),
        "processed_dir": str(processed_dir),
        "seed": seed,
        "target_size": list(target_size),
        "ratios": {"train": ratios[0], "val": ratios[1], "test": ratios[2]},
        "leakage_check": {
            "passed": leakage_passed,
            "train_val_overlap": train_val_overlap,
            "train_test_overlap": train_test_overlap,
            "val_test_overlap": val_test_overlap,
            "cross_class_duplicates_removed": len(cross_class_hashes),
        },
        "classes": class_summaries,
        "totals": totals,
        "skipped_files": [asdict(item) for item in all_skipped],
    }

    class_labels = [row["class_label"] for row in class_summaries]
    _write_summary_files(
        processed_dir,
        class_labels=class_labels,
        summary_payload=summary_payload,
    )
    _print_console_summary(summary_payload)
    return summary_payload


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate, deduplicate, resize (224x224), and split raw leaf images into train/val/test."
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=DEFAULT_RAW_DIR,
        help=f"Directory containing class subfolders (default: {DEFAULT_RAW_DIR})",
    )
    parser.add_argument(
        "--processed-dir",
        type=Path,
        default=DEFAULT_PROCESSED_DIR,
        help=f"Output directory for train/val/test splits (default: {DEFAULT_PROCESSED_DIR})",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help=f"Random seed for reproducible splitting (default: {DEFAULT_SEED})",
    )
    parser.add_argument(
        "--train-ratio",
        type=float,
        default=DEFAULT_RATIOS[0],
        help="Training split ratio (default: 0.70)",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=DEFAULT_RATIOS[1],
        help="Validation split ratio (default: 0.15)",
    )
    parser.add_argument(
        "--test-ratio",
        type=float,
        default=DEFAULT_RATIOS[2],
        help="Test split ratio (default: 0.15)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing train/val/test directories inside processed-dir.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Optional worker thread count for image validation and resizing.",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = _build_arg_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        prepare_dataset(
            raw_dir=args.raw_dir.resolve(),
            processed_dir=args.processed_dir.resolve(),
            seed=args.seed,
            ratios=(args.train_ratio, args.val_ratio, args.test_ratio),
            overwrite=args.overwrite,
            workers=args.workers,
        )
        return 0
    except Exception as exc:
        print(f"Dataset preparation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

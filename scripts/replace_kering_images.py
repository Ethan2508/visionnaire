#!/usr/bin/env python3
"""
Replace product images for existing Kering products on the website.
- Reads images extracted at /tmp/kering-img/
- Matches each existing product by style code in its name
- Uploads to Supabase Storage at products/{slug}/{i}.{ext}
- Replaces rows in product_images table

Usage:
  python scripts/replace_kering_images.py --dry-run
  python scripts/replace_kering_images.py --apply
"""
import argparse
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://odirisqsqpdvitisvdzn.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
if not SERVICE_KEY:
    print("ERROR: set SUPABASE_SERVICE_KEY env var", file=sys.stderr)
    sys.exit(1)
BUCKET = "products"
IMG_ROOT = Path("/tmp/kering-img")
MAX_IMAGES = 5
VIEW_PRIORITY = ["front", "cat", "zoom"]

BRANDS = {
    "7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1": "Gucci",
    "82cb62c5-deb0-4131-aa64-3b150e832d83": "Montblanc",
    "5e06fafa-f165-4e1c-80a1-d9b9e065d56c": "Saint Laurent",
    "168d845e-e6c8-4696-b620-f60f924f93c9": "Bottega Veneta",
}

FNAME_RE = re.compile(r"^(?P<key>.+?)-(?P<variant>\d{3,4}[A-Z]?)-(?P<view>front|cat|zoom)-xxl\.(?P<ext>jpg|jpeg|png)$", re.IGNORECASE)


def index_images():
    """Return dict[key_upper] -> list of (variant, view, abs_path, ext)."""
    idx = defaultdict(list)
    for path in IMG_ROOT.rglob("*"):
        if not path.is_file():
            continue
        m = FNAME_RE.match(path.name)
        if not m:
            continue
        key = m.group("key").upper()
        idx[key].append((m.group("variant"), m.group("view").lower(), str(path), m.group("ext").lower()))
    return idx


def candidate_keys(brand: str, name: str):
    """Return ordered candidate keys to look up in the index."""
    if brand in ("Gucci", "Montblanc", "Bottega Veneta"):
        m = re.search(r"\b([A-Z]{2}\d{3,5}[A-Z]{0,3})\b", name)
        return [m.group(1).upper()] if m else []
    if brand == "Saint Laurent":
        rest = re.sub(r"^Saint Laurent\s+", "", name).strip()
        key = re.sub(r"\s+", "_", rest.replace("/", "_"))
        # Filter out garbage refs (no SL prefix, no CLASSIC_)
        if not (key.startswith("SL_") or key.startswith("CLASSIC_")):
            return []
        parts = key.split("_")
        out = []
        while len(parts) >= 2:
            out.append("_".join(parts).upper())
            parts.pop()
        return out
    return []


def pick_images(records):
    """records: list of (variant, view, path, ext). Return list of (path, ext) up to MAX_IMAGES.

    Strategy: for the FIRST variant, include all available views in the order
    cat -> front -> zoom (gives 3 different angles of the same colorway). Then
    add `cat` views from other variants to showcase color options.
    """
    by_variant = defaultdict(dict)  # variant -> {view: (path,ext)}
    for variant, view, path, ext in records:
        by_variant[variant][view] = (path, ext)
    variants = sorted(by_variant.keys())
    selected = []
    seen = set()

    def add(p):
        if p and p not in seen:
            selected.append(p)
            seen.add(p)

    # Pass 1: all views of the first variant (cat first = wider/lifestyle, then front, then zoom)
    if variants:
        first = variants[0]
        for view in ("cat", "front", "zoom"):
            if view in by_variant[first]:
                add(by_variant[first][view])
                if len(selected) >= MAX_IMAGES:
                    return selected

    # Pass 2: cat view from other variants (different colors)
    for v in variants[1:]:
        if "cat" in by_variant[v]:
            add(by_variant[v]["cat"])
            if len(selected) >= MAX_IMAGES:
                return selected

    # Pass 3: front view from other variants if still room
    for v in variants[1:]:
        if "front" in by_variant[v]:
            add(by_variant[v]["front"])
            if len(selected) >= MAX_IMAGES:
                return selected

    return selected


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()

    print("Indexing images...", flush=True)
    idx = index_images()
    print(f"  {sum(len(v) for v in idx.values())} image entries across {len(idx)} keys", flush=True)

    sb = create_client(SUPABASE_URL, SERVICE_KEY)
    res = sb.table("products").select("id,name,slug,brand_id").in_("brand_id", list(BRANDS.keys())).execute()
    products = res.data
    print(f"Loaded {len(products)} existing products", flush=True)

    matched = []
    unmatched = []
    for p in products:
        brand = BRANDS[p["brand_id"]]
        keys = candidate_keys(brand, p["name"])
        chosen = None
        chosen_key = None
        for k in keys:
            if k in idx:
                chosen = idx[k]
                chosen_key = k
                break
        if not chosen:
            unmatched.append((brand, p["name"], keys))
            continue
        imgs = pick_images(chosen)
        if not imgs:
            unmatched.append((brand, p["name"], [chosen_key]))
            continue
        matched.append((p, chosen_key, imgs))

    print(f"\n=== MATCHED: {len(matched)} ===")
    for p, key, imgs in matched:
        print(f"  {p['slug']}  <-  {key}  ({len(imgs)} imgs)")
    print(f"\n=== UNMATCHED: {len(unmatched)} ===")
    for brand, name, keys in unmatched:
        print(f"  [{brand}] {name}  (tried: {keys})")

    if args.dry_run:
        print("\nDry run; no changes made.")
        return 0

    if args.limit:
        matched = matched[: args.limit]

    print(f"\nApplying changes for {len(matched)} products...", flush=True)
    storage = sb.storage.from_(BUCKET)
    for p, key, imgs in matched:
        slug = p["slug"]
        pid = p["id"]
        # Delete existing storage objects for this slug
        try:
            existing = storage.list(slug)
            if existing:
                storage.remove([f"{slug}/{e['name']}" for e in existing])
        except Exception as e:
            print(f"  [warn] list/remove {slug}: {e}")

        urls = []
        for i, (path, ext) in enumerate(imgs):
            ext_norm = "jpg" if ext.lower() in ("jpg", "jpeg") else ext.lower()
            dst = f"{slug}/{i}.{ext_norm}"
            with open(path, "rb") as fh:
                data = fh.read()
            mime = "image/png" if ext_norm == "png" else "image/jpeg"
            storage.upload(dst, data, {"content-type": mime, "upsert": "true"})
            url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{dst}"
            urls.append(url)

        # Replace product_images rows
        sb.table("product_images").delete().eq("product_id", pid).execute()
        rows = [
            {
                "product_id": pid,
                "url": url,
                "sort_order": i,
                "is_primary": i == 0,
            }
            for i, url in enumerate(urls)
        ]
        sb.table("product_images").insert(rows).execute()
        print(f"  ✓ {slug}: {len(urls)} images")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

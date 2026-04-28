#!/usr/bin/env python3
"""
Import supplier images for Kering brands from ZIPs into Supabase Storage.
- Extract both ZIPs
- Match images by style code (e.g., GG1968S, CT0455OJ)
- Upload to supabase.co/storage/v1/object/public/products/[slug]/
- Update product_images table with new URLs
"""

import os
import json
import zipfile
import urllib.request
import urllib.parse
import shutil
import re
from pathlib import Path
from collections import defaultdict

# Load env
env = {}
for l in Path('.env.production').read_text().splitlines():
    if l and not l.startswith('#') and '=' in l:
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"').replace('\\n', '')

SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
STORAGE_BUCKET = 'products'

headers_api = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
}

# Extract ZIPs
extract_dir = Path('/tmp/kering-images-new')
if extract_dir.exists():
    shutil.rmtree(extract_dir)
extract_dir.mkdir(parents=True)

print("📦 Extracting ZIPs...")
for zfile in ['GUCCI.zip', 'OneDrive_1_28-04-2026.zip']:
    with zipfile.ZipFile(zfile, 'r') as z:
        z.extractall(extract_dir)
        print(f"  ✓ {zfile}")

# Map style codes to image files: style_code -> [list of (brand_folder, full_path)]
style_images = defaultdict(list)

for img_file in extract_dir.rglob('*'):
    if not img_file.is_file() or not img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
        continue
    
    # Extract style code from filename
    # Format: STYLECODE-VARIANTNUM-VIEWTYPE-SIZE.jpg
    # e.g., GG1968S-001-front-xxl.jpg, CT0455OJ-003-cat-xxl.jpg
    match = re.match(r'^([A-Z]{2}\d{4}[A-Z]+)(?:_\d+)?-\d{3}-', img_file.name)
    if match:
        style_code = match.group(1)
        # Get brand folder (parent path)
        brand_folder = None
        for parent in img_file.parents:
            if parent.name in ['GUCCI', 'CARTIER', 'SAINT LAURENT', 'MONTBLANC', 'BOTTEGA VENETA']:
                brand_folder = parent.name
                break
        
        if brand_folder:
            style_images[style_code].append((brand_folder, str(img_file)))

print(f"\n🔍 Found {len(style_images)} unique style codes with images")

# Get all active Kering products from DB
brands_map = {
    'GUCCI': '7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1',
    'CARTIER': '78ef5a1d-1f67-4231-996e-feed6d608f00',
    'SAINT LAURENT': '5e06fafa-f165-4e1c-80a1-d9b9e065d56c',
    'MONTBLANC': '82cb62c5-deb0-4131-aa64-3b150e832d83',
    'BOTTEGA VENETA': '168d845e-e6c8-4696-b620-f60f924f93c9',
}

all_products = []
for brand_name, brand_id in brands_map.items():
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,name,slug,brand_id&brand_id=eq.{brand_id}&is_active=eq.true"
    req = urllib.request.Request(url, headers={'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'})
    with urllib.request.urlopen(req) as r:
        products = json.loads(r.read())
    all_products.extend(products)
    print(f"  {brand_name}: {len(products)} products")

print(f"\n📦 {len(all_products)} total active Kering products")

# For each product, extract style code and find matching images
uploads = []
matched_count = 0

for prod in all_products:
    # Extract style code from product name
    # E.g., "Gucci GG1968S" -> "GG1968S"
    name_parts = prod['name'].split(' ', 1)
    if len(name_parts) < 2:
        continue
    style_code = name_parts[1].strip()
    
    if style_code in style_images:
        matched_count += 1
        uploads.append({
            'product': prod,
            'style_code': style_code,
            'image_paths': style_images[style_code],
        })
        print(f"  ✓ {prod['name']}: {len(style_images[style_code])} images")

print(f"\n✅ Matched {matched_count}/{len(all_products)} products to images")

if not uploads:
    print("❌ No matches found! Exiting.")
    exit(1)

print(f"\n📤 Uploading images to Supabase Storage...")
print(f"   Bucket: {STORAGE_BUCKET}")

# Upload helper
def upload_image(product_slug, local_path, sort_order):
    """Upload single image file to Supabase Storage."""
    with open(local_path, 'rb') as f:
        data = f.read()
    
    # Determine file extension
    ext = Path(local_path).suffix.lower()
    
    # Construct storage path: products/{slug}/{sort_order}{ext}
    storage_path = f"{STORAGE_BUCKET}/{product_slug}/{sort_order}{ext}"
    
    # Upload via REST API
    url = f"{SUPABASE_URL}/storage/v1/object/{storage_path}"
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read())
            return True
    except urllib.error.HTTPError as e:
        print(f"    ❌ Upload failed: {e.read().decode()[:100]}")
        return False

# Upload all images and collect DB updates
db_updates = []

for upload_item in uploads:
    prod = upload_item['product']
    product_slug = prod['slug']
    
    # Sort images by filename to maintain order
    sorted_paths = sorted(upload_item['image_paths'], key=lambda x: x[1])
    
    for sort_order, (brand, img_path) in enumerate(sorted_paths):
        if upload_image(product_slug, img_path, sort_order):
            # Generate public URL
            ext = Path(img_path).suffix.lower()
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{product_slug}/{sort_order}{ext}"
            db_updates.append({
                'product_id': prod['id'],
                'url': public_url,
                'sort_order': sort_order,
                'is_primary': (sort_order == 0),
            })

print(f"\n✅ Uploaded {len(db_updates)} images")

# Update product_images in DB
print(f"\n🔄 Updating product_images table...")

# Group by product
by_product = defaultdict(list)
for update in db_updates:
    by_product[update['product_id']].append(update)

updated_count = 0
for product_id, images in by_product.items():
    # Delete old images for this product
    url = f"{SUPABASE_URL}/rest/v1/product_images?product_id=eq.{product_id}"
    req = urllib.request.Request(url, headers=headers_api, method='DELETE')
    try:
        with urllib.request.urlopen(req) as r:
            pass
    except:
        pass
    
    # Insert new images
    for img in images:
        data = json.dumps({
            'product_id': product_id,
            'url': img['url'],
            'alt_text': 'Produit',
            'sort_order': img['sort_order'],
            'is_primary': img['is_primary'],
        }).encode()
        
        url = f"{SUPABASE_URL}/rest/v1/product_images"
        req = urllib.request.Request(url, data=data, headers=headers_api, method='POST')
        try:
            with urllib.request.urlopen(req) as r:
                updated_count += 1
        except urllib.error.HTTPError as e:
            print(f"    ❌ DB insert failed: {e.read().decode()[:100]}")

print(f"✅ Updated {updated_count} product_images rows")
print(f"\n🎉 Import complete!")

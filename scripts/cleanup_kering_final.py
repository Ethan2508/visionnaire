#!/usr/bin/env python3
"""
Final pass: merge remaining duplicates and handle garbage references.
"""

import json
import re
import sys
import urllib.request
import urllib.parse
from collections import defaultdict
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent / '.env.production'
env_vars = {}
for line in ENV_FILE.read_text().splitlines():
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env_vars[k.strip()] = v.strip().strip('"').replace('\\n', '')

SUPABASE_URL = env_vars.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
SERVICE_KEY = env_vars.get('SUPABASE_SERVICE_ROLE_KEY', '')

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

def api_get(path, params):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def api_patch(path, params, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{urllib.parse.urlencode(params)}"
    body = json.dumps(data).encode()
    hdrs = dict(HEADERS)
    hdrs['Prefer'] = 'return=representation'
    req = urllib.request.Request(url, data=body, headers=hdrs, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"    ❌ PATCH Error: {e.read().decode()[:150]}")
        return None

def api_post(path, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"    ❌ POST Error: {e.read().decode()[:150]}")
        return None

def api_delete(path, params):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except urllib.error.HTTPError as e:
        print(f"    ❌ DELETE Error: {e.read().decode()[:150]}")
        return False

# ─── Step 1: Merge remaining duplicates ───
print("🔄 Step 1: Fusion des doublons restants...\n")

# These are duplicate slugs that should be merged into the main product
duplicates_to_merge = {
    # slug of duplicate → slug of main product to merge into
    'cartier-ct00610-003': 'cartier-ct0061o',
    'cartier-ct02810-004': 'cartier-ct0281o',
    'gucci-gg12210-004': 'gucci-gg1221o',
    'gucci-gg12210-005': 'gucci-gg1221o',
    'montblanc-mb02790-001-54020-145': 'montblanc-mb0279o',
    'montblanc-mb02790-002-54020-145': 'montblanc-mb0279o',
    'montblanc-mb03100a-003-52021-145-xl': 'montblanc-mb0310oa',
    'montblanc-mb03890-004-50': 'montblanc-mb0389o',
    'montblanc-mb03910a-002-81021-145': 'montblanc-mb0391oa',
}

# Also the CT0455OJ duplicate
duplicates_to_merge['cartier-ct04550j-001'] = 'cartier-ct0455oj'

# SL MT46 and MTTS already cleaned but slug might be different 
# Let's check saint-laurent-sl-mt46-opt and saint-laurent-sl-mtts

# Also check saint-laurent-t11bp-41930 which has price=349, might be already edited
# Let's just mark it as kept

merged = 0
for dup_slug, main_slug in duplicates_to_merge.items():
    # Get the duplicate product
    dup_products = api_get('products', {'select': 'id,name,slug', 'slug': f'eq.{dup_slug}'})
    if not dup_products:
        print(f"  ⏭️ {dup_slug} — déjà supprimé ou pas trouvé")
        continue
    dup = dup_products[0]
    
    # Get the main product
    main_products = api_get('products', {'select': 'id,name,slug', 'slug': f'eq.{main_slug}'})
    if not main_products:
        print(f"  ⚠️ {main_slug} — produit principal pas trouvé!")
        continue
    main = main_products[0]
    
    # Get duplicate's images
    dup_images = api_get('product_images', {
        'select': 'id,url,alt_text,sort_order,is_primary',
        'product_id': f'eq.{dup["id"]}'
    })
    
    # Get main product's current max sort_order
    main_images = api_get('product_images', {
        'select': 'id,sort_order',
        'product_id': f'eq.{main["id"]}'
    })
    max_sort = max((img.get('sort_order', 0) or 0) for img in main_images) + 1 if main_images else 0
    
    # Get the variant number from the slug to use as color label
    slug_suffix = dup_slug.split('-')[-1]
    color_label = f"Variante {slug_suffix}"
    
    # Create a new variant on the main product
    variant_sku = f"{main['name'].split()[-1]}-{slug_suffix}"
    new_variant = api_post('product_variants', {
        'product_id': main['id'],
        'sku': variant_sku,
        'color_name': color_label,
        'stock_quantity': 1,
        'is_active': True,
    })
    new_variant_id = new_variant[0]['id'] if new_variant else None
    
    # Move images to main product
    for i, img in enumerate(dup_images):
        api_patch('product_images', {'id': f'eq.{img["id"]}'}, {
            'product_id': main['id'],
            'variant_id': new_variant_id,
            'sort_order': max_sort + i,
            'is_primary': False,
            'alt_text': f"{main['name']} {color_label} - Photo {i+1}"
        })
    
    # Delete duplicate's old variant
    dup_variants = api_get('product_variants', {
        'select': 'id',
        'product_id': f'eq.{dup["id"]}'
    })
    for dv in dup_variants:
        api_delete('product_variants', {'id': f'eq.{dv["id"]}'})
    
    # Delete duplicate product
    api_delete('products', {'id': f'eq.{dup["id"]}'})
    merged += 1
    print(f"  ✅ {dup_slug} → fusionné dans {main_slug} ({len(dup_images)} images transférées)")

print(f"\n  📊 {merged} doublons fusionnés")

# ─── Step 2: Handle garbage references ───
print("\n🗑️ Step 2: Nettoyage des références garbage...\n")

# These have photos but unidentifiable references - give them clean names
garbage_slugs = [
    'cartier-fool711690',
    'cartier-g77k62bk', 
    'cartier-ho2k89gz',
    'gucci-b01hm16310',
    'gucci-t11g611130',
    'gucci-tfc1174748',
    'gucci-ggizzto-006',
    'montblanc-r71kl01450',
    'saint-laurent-d01em38750',
    'saint-laurent-doolu75640',
    'saint-laurent-r31cq25450',
    'saint-laurent-soofs11240',
    'saint-laurent-t10ey-22850',
    'saint-laurent-tool-4d3310',
]

brand_name_map = {
    'cartier': 'Cartier',
    'gucci': 'Gucci',
    'saint-laurent': 'Saint Laurent',
    'montblanc': 'Montblanc',
}

cleaned = 0
for slug in garbage_slugs:
    products = api_get('products', {'select': 'id,name,slug,base_price', 'slug': f'eq.{slug}'})
    if not products:
        print(f"  ⏭️ {slug} — pas trouvé (déjà supprimé?)")
        continue
    
    p = products[0]
    brand_prefix = slug.split('-')[0]
    if slug.startswith('saint-laurent'):
        brand_prefix = 'saint-laurent'
    
    brand_name = brand_name_map.get(brand_prefix, brand_prefix.title())
    
    # Extract whatever reference code is there
    ref = slug[len(brand_prefix)+1:].upper().replace('-', ' ')
    new_name = f"{brand_name} {ref}"
    
    api_patch('products', {'id': f'eq.{p["id"]}'}, {
        'name': new_name,
    })
    cleaned += 1
    print(f"  📝 {slug} → nom nettoyé: {new_name}")

print(f"\n  📊 {cleaned} références nettoyées")

# ─── Step 3: Handle saint-laurent-t11bp-41930 (has price 349) ───
print("\n📝 Step 3: Vérification des cas spéciaux...")

special = api_get('products', {'select': 'id,name,slug,base_price', 'slug': 'eq.saint-laurent-t11bp-41930'})
if special:
    api_patch('products', {'id': f'eq.{special[0]["id"]}'}, {
        'name': 'Saint Laurent T11BP',
    })
    print(f"  📝 saint-laurent-t11bp-41930 → nom: Saint Laurent T11BP (prix déjà à {special[0]['base_price']}€)")

# ─── Final Summary ───
print("\n📊 Récupération du résumé final...")

all_products = api_get('products', {
    'select': 'id,name,slug,base_price,category,gender,brand_id',
    'brand_id': f'in.(78ef5a1d-1f67-4231-996e-feed6d608f00,7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1,5e06fafa-f165-4e1c-80a1-d9b9e065d56c,82cb62c5-deb0-4131-aa64-3b150e832d83)',
    'order': 'name',
})

brand_id_to_name = {
    '78ef5a1d-1f67-4231-996e-feed6d608f00': 'Cartier',
    '7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1': 'Gucci',
    '5e06fafa-f165-4e1c-80a1-d9b9e065d56c': 'Saint Laurent',
    '82cb62c5-deb0-4131-aa64-3b150e832d83': 'Montblanc',
}

print(f"\n{'='*70}")
print(f"  ÉTAT FINAL DES PRODUITS KERING")
print(f"{'='*70}")

by_brand = defaultdict(list)
for p in all_products:
    brand = brand_id_to_name.get(p['brand_id'], '?')
    by_brand[brand].append(p)

total_with_price = 0
total_zero = 0

for brand in ['Cartier', 'Gucci', 'Montblanc', 'Saint Laurent']:
    prods = by_brand[brand]
    with_price = sum(1 for p in prods if p['base_price'] and p['base_price'] > 0)
    zero = len(prods) - with_price
    total_with_price += with_price
    total_zero += zero
    print(f"\n  {brand}: {len(prods)} produits ({with_price} avec prix, {zero} sans)")
    for p in prods:
        price_str = f"{p['base_price']}€" if p['base_price'] and p['base_price'] > 0 else "⚠️ 0€"
        print(f"    {p['name']:45s} | {price_str:10s} | {p['category']:8s} | {p['gender']}")

print(f"\n{'='*70}")
print(f"  TOTAL: {len(all_products)} produits | {total_with_price} avec prix | {total_zero} sans prix")
print(f"{'='*70}")

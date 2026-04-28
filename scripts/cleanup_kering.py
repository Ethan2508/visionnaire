#!/usr/bin/env python3
"""
Nettoyage des produits Kering (Gucci, Cartier, Saint Laurent, Montblanc)
+ création marque Bottega Veneta.

Actions:
1. Match chaque produit existant avec le fichier Excel Kering
2. Met à jour: nom propre, prix SRP, catégorie, genre, matériaux, couleurs
3. Fusionne les doublons (même style = 1 produit + variantes couleur)
4. Corrige le slug pour un format propre
5. Gère les références non-matchées (les garde avec un flag)
"""

import json
import re
import sys
import urllib.request
import urllib.parse
import openpyxl
from collections import defaultdict
from pathlib import Path

# ─── Config ───
ENV_FILE = Path(__file__).parent.parent / '.env.production'
env_vars = {}
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip().strip('"').replace('\\n', '')

SUPABASE_URL = env_vars.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
SERVICE_KEY = env_vars.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SERVICE_KEY:
    print("❌ Clés Supabase manquantes dans .env.production")
    sys.exit(1)

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

EXCEL_FILE = Path(__file__).parent.parent / 'Price_List_ NOUVEAU TARIF KERINGEYEWEAR AVRIL 2026.xlsx'

# Brand IDs (from DB)
BRAND_IDS = {
    'cartier': '78ef5a1d-1f67-4231-996e-feed6d608f00',
    'gucci': '7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1',
    'saint-laurent': '5e06fafa-f165-4e1c-80a1-d9b9e065d56c',
    'montblanc': '82cb62c5-deb0-4131-aa64-3b150e832d83',
    'andy-brook': 'd41ace86-a483-4a08-a7df-c6d279dfafc5',
}

KERING_BRAND_CODES = {
    'GUC': ('gucci', 'Gucci'),
    'CTR': ('cartier', 'Cartier'),
    'SLP': ('saint-laurent', 'Saint Laurent'),
    'MMM': ('montblanc', 'Montblanc'),
    'BTV': ('bottega-veneta', 'Bottega Veneta'),
}

# ─── HTTP helpers ───
def api_request(method, path, data=None, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += '?' + urllib.parse.urlencode(params)
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ❌ API Error {e.code}: {err[:200]}")
        return None

def db_select(table, query_params):
    return api_request('GET', table, params=query_params)

def db_update(table, match_params, data):
    """Update rows matching params."""
    headers = dict(HEADERS)
    headers['Prefer'] = 'return=representation'
    
    url = f"{SUPABASE_URL}/rest/v1/{table}?{urllib.parse.urlencode(match_params)}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method='PATCH')
    
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ❌ Update Error {e.code}: {err[:200]}")
        return None

def db_insert(table, data):
    return api_request('POST', table, data=data)

def db_delete(table, match_params):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{urllib.parse.urlencode(match_params)}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ❌ Delete Error {e.code}: {err[:200]}")
        return False

# ─── Load Kering Excel ───
def load_kering_data():
    print("📊 Chargement du fichier Excel Kering...")
    wb = openpyxl.load_workbook(str(EXCEL_FILE))
    ws = wb.active
    
    style_data = defaultdict(list)  # style_norm -> list of variant entries
    
    for row in ws.iter_rows(min_row=2, max_col=26):
        brand_code = row[4].value
        if brand_code not in KERING_BRAND_CODES:
            continue
        
        style = str(row[7].value or '').strip()
        variant = str(row[8].value or '').strip()
        sku = str(row[5].value or '').strip()
        ean = str(row[10].value or '').strip()
        cat = str(row[6].value or '').strip()
        front_color = str(row[11].value or '').strip()
        temple_color = str(row[12].value or '').strip()
        lens_color = str(row[13].value or '').strip()
        lens_material = str(row[14].value or '').strip()
        main_material = str(row[15].value or '').strip()
        gender = str(row[16].value or '').strip()
        fitting = str(row[17].value or '').strip()
        srp = row[24].value
        whs = row[25].value
        
        style_norm = re.sub(r'\s+', '', style).upper()
        
        entry = {
            'brand_code': brand_code,
            'sku': sku, 'style': style, 'variant': variant,
            'style_norm': style_norm, 'ean': ean, 'category': cat,
            'front_color': front_color, 'temple_color': temple_color,
            'lens_color': lens_color, 'lens_material': lens_material,
            'main_material': main_material, 'gender': gender,
            'fitting': fitting, 'srp': srp, 'whs': whs
        }
        style_data[style_norm].append(entry)
    
    print(f"  ✅ {sum(len(v) for v in style_data.values())} SKUs pour {len(style_data)} styles chargés")
    return style_data

# ─── Match product slug to Kering style ───
def match_slug_to_kering(slug, brand_slug, style_data):
    """Try to match a site product slug to a Kering style."""
    ref = slug[len(brand_slug)+1:].upper().replace('-', '')
    
    best_match = None
    best_score = 0
    best_style_norm = None
    
    # Determine which brand codes to search
    brand_code = {
        'cartier': 'CTR', 'gucci': 'GUC',
        'saint-laurent': 'SLP', 'montblanc': 'MMM'
    }.get(brand_slug)
    
    for style_norm, entries in style_data.items():
        if entries[0]['brand_code'] != brand_code:
            continue
        
        # Check if style_norm is contained in ref
        if style_norm in ref:
            score = len(style_norm)
            if score > best_score:
                best_score = score
                best_style_norm = style_norm
                
                # Try to extract variant number
                remainder = ref[ref.index(style_norm)+len(style_norm):]
                variant_match = re.match(r'^(\d{3})', remainder)
                variant_num = variant_match.group(1) if variant_match else None
                
                best_match = entries[0]  # default to first
                if variant_num:
                    for e in entries:
                        if e['variant'].endswith(variant_num):
                            best_match = e
                            break
    
    # Additional check for SL styles with slashes like "SL 782/K" -> "SL782K"
    if not best_match and brand_slug == 'saint-laurent':
        for style_norm, entries in style_data.items():
            if entries[0]['brand_code'] != 'SLP':
                continue
            # Try matching without the slash
            style_noslash = style_norm.replace('/', '')
            if style_noslash in ref:
                score = len(style_noslash)
                if score > best_score:
                    best_score = score
                    best_style_norm = style_norm
                    remainder = ref[ref.index(style_noslash)+len(style_noslash):]
                    variant_match = re.match(r'^(\d{3})', remainder)
                    variant_num = variant_match.group(1) if variant_match else None
                    best_match = entries[0]
                    if variant_num:
                        for e in entries:
                            if e['variant'].endswith(variant_num):
                                best_match = e
                                break
    
    # For Cartier: try matching CTO -> CT0 (common OCR error)
    if not best_match and brand_slug == 'cartier':
        ref_fixed = ref.replace('CTO', 'CT0')
        if ref_fixed != ref:
            for style_norm, entries in style_data.items():
                if entries[0]['brand_code'] != 'CTR':
                    continue
                if style_norm in ref_fixed:
                    score = len(style_norm)
                    if score > best_score:
                        best_score = score
                        best_style_norm = style_norm
                        best_match = entries[0]
    
    return best_match, best_style_norm

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', 
                  text.lower().replace('/', '-')
                  ).strip('-')[:100]

def map_gender(kering_gender):
    g = kering_gender.lower()
    if g in ('man', 'male'): return 'homme'
    if g in ('woman', 'female'): return 'femme'
    if g in ('kid', 'kids', 'child'): return 'enfant'
    return 'mixte'

def map_category(kering_cat):
    if kering_cat == 'SUN': return 'soleil'
    if kering_cat == 'OPT': return 'vue'
    return 'vue'

def map_material(kering_material):
    m = kering_material.upper()
    if 'METAL' in m: return 'metal'
    if 'ACETATE' in m or 'INJECTED' in m: return 'acetate'
    if 'TITANIUM' in m: return 'titane'
    if 'COMBINED' in m: return 'combiné'
    return kering_material.lower() if kering_material else None

# ─── Main cleanup ───
def main():
    style_data = load_kering_data()
    
    # Get all Kering brand products from DB
    kering_brand_ids = [BRAND_IDS[b] for b in ['cartier', 'gucci', 'saint-laurent', 'montblanc']]
    
    print("\n📦 Récupération des produits existants...")
    products = db_select('products', {
        'select': 'id,name,slug,category,gender,base_price,brand_id,frame_shape,frame_material,frame_color,is_featured,is_active',
        'brand_id': f'in.({",".join(kering_brand_ids)})',
        'order': 'slug',
    })
    print(f"  ✅ {len(products)} produits Kering trouvés dans la DB")
    
    # Get variants and images for these products
    product_ids = [p['id'] for p in products]
    
    variants = db_select('product_variants', {
        'select': 'id,product_id,sku,color_name,color_hex,size,price_override,stock_quantity,is_active',
        'product_id': f'in.({",".join(product_ids)})',
    })
    variant_map = defaultdict(list)
    for v in variants:
        variant_map[v['product_id']].append(v)
    
    images = db_select('product_images', {
        'select': 'id,product_id,variant_id,url,alt_text,is_primary,sort_order',
        'product_id': f'in.({",".join(product_ids)})',
    })
    image_map = defaultdict(list)
    for img in images:
        image_map[img['product_id']].append(img)
    
    # Reverse lookup: brand_id -> brand_slug
    brand_slug_map = {v: k for k, v in BRAND_IDS.items()}
    
    # ─── Phase 1: Match products to Kering data ───
    print("\n🔍 Phase 1: Matching des produits avec l'Excel Kering...")
    
    matched_products = []  # (product, kering_entry, style_norm)
    unmatched_products = []
    
    for p in products:
        brand_slug = brand_slug_map[p['brand_id']]
        match, style_norm = match_slug_to_kering(p['slug'], brand_slug, style_data)
        
        if match:
            matched_products.append((p, match, style_norm))
        else:
            unmatched_products.append(p)
    
    print(f"  ✅ {len(matched_products)} matchés | ❌ {len(unmatched_products)} non-matchés")
    
    # ─── Phase 2: Group by style (detect duplicates) ───
    print("\n🔄 Phase 2: Détection des doublons (même style)...")
    
    style_groups = defaultdict(list)  # style_norm -> [(product, kering_entry)]
    for p, ke, sn in matched_products:
        style_groups[sn].append((p, ke))
    
    duplicates = {sn: group for sn, group in style_groups.items() if len(group) > 1}
    print(f"  📋 {len(duplicates)} styles avec doublons:")
    for sn, group in duplicates.items():
        style_name = group[0][1]['style']
        print(f"    {style_name}: {[p['slug'] for p, _ in group]}")
    
    # ─── Phase 3: Update matched products ───
    print("\n✏️ Phase 3: Mise à jour des produits matchés...")
    
    updated = 0
    deleted_ids = []
    
    for style_norm, group in style_groups.items():
        # Pick the "primary" product (keep the one with most images, or first)
        group.sort(key=lambda x: len(image_map.get(x[0]['id'], [])), reverse=True)
        primary_product, primary_kering = group[0]
        
        brand_slug = brand_slug_map[primary_product['brand_id']]
        brand_name = KERING_BRAND_CODES[primary_kering['brand_code']][1]
        style_name = primary_kering['style']
        
        # Build clean product data
        new_name = f"{brand_name} {style_name}"
        new_slug = slugify(f"{brand_name}-{style_name}")
        new_category = map_category(primary_kering['category'])
        new_gender = map_gender(primary_kering['gender'])
        new_price = float(primary_kering['srp']) if primary_kering['srp'] else 0
        new_material = map_material(primary_kering['main_material'])
        new_color = primary_kering['front_color'].capitalize() if primary_kering['front_color'] else None
        
        # Check slug collision (avoid duplicates)
        existing_slugs = [p['slug'] for p in products]
        if new_slug != primary_product['slug'] and new_slug in existing_slugs:
            # Another product already has this slug - it's a duplicate!
            # Append variant code to make unique
            new_slug = slugify(f"{brand_name}-{style_name}-{primary_kering['variant']}")
        
        # Update the product
        update_data = {
            'name': new_name,
            'slug': new_slug,
            'category': new_category,
            'gender': new_gender,
            'base_price': new_price,
            'frame_material': new_material,
            'frame_color': new_color,
        }
        
        result = db_update('products', {'id': f'eq.{primary_product["id"]}'}, update_data)
        if result:
            updated += 1
            print(f"  ✅ {primary_product['slug']:55s} → {new_name} | {new_price}€ | {new_category} | {new_gender}")
            
            # Update the primary variant
            primary_variants = variant_map.get(primary_product['id'], [])
            if primary_variants:
                variant_update = {
                    'sku': primary_kering['sku'] or primary_kering['variant'],
                    'color_name': primary_kering['front_color'].capitalize() if primary_kering['front_color'] else None,
                }
                db_update('product_variants', {'id': f'eq.{primary_variants[0]["id"]}'}, variant_update)
            
            # Update image alt texts
            for img in image_map.get(primary_product['id'], []):
                idx = img.get('sort_order', 0) or 0
                db_update('product_images', {'id': f'eq.{img["id"]}'}, {
                    'alt_text': f"{new_name} - Photo {idx + 1}"
                })
        
        # Handle duplicates: merge their images into the primary, then delete
        if len(group) > 1:
            for dup_product, dup_kering in group[1:]:
                dup_images = image_map.get(dup_product['id'], [])
                dup_variants = variant_map.get(dup_product['id'], [])
                
                # Create a new variant on the primary product for this color
                dup_color = dup_kering['front_color'].capitalize() if dup_kering['front_color'] else 'Variante'
                dup_variant_data = {
                    'product_id': primary_product['id'],
                    'sku': dup_kering['sku'] or dup_kering['variant'],
                    'color_name': dup_color,
                    'stock_quantity': 1,
                    'is_active': True,
                }
                new_variant = db_insert('product_variants', dup_variant_data)
                new_variant_id = new_variant[0]['id'] if new_variant else None
                
                # Move images to primary product
                if dup_images and new_variant_id:
                    max_sort = max((img.get('sort_order', 0) or 0) for img in image_map.get(primary_product['id'], [])) + 1 if image_map.get(primary_product['id']) else 0
                    for i, img in enumerate(dup_images):
                        db_update('product_images', {'id': f'eq.{img["id"]}'}, {
                            'product_id': primary_product['id'],
                            'variant_id': new_variant_id,
                            'sort_order': max_sort + i,
                            'is_primary': False,
                            'alt_text': f"{new_name} {dup_color} - Photo {i + 1}"
                        })
                
                # Delete duplicate variants
                for dv in dup_variants:
                    db_delete('product_variants', {'id': f'eq.{dv["id"]}'})
                
                # Delete duplicate product
                db_delete('products', {'id': f'eq.{dup_product["id"]}'})
                deleted_ids.append(dup_product['id'])
                print(f"    🗑️ Doublon supprimé: {dup_product['slug']} (images transférées)")
    
    # ─── Phase 4: Handle unmatched products ───
    print(f"\n⚠️ Phase 4: Produits non-matchés ({len(unmatched_products)})...")
    
    # Identify garbage references vs legitimate products
    garbage_patterns = [
        # Random hashes/codes (not product references)
        r'^(cartier|gucci|saint-laurent|montblanc)-(fool|g77k|ho2k|b01h|t11g|tfc1|d01e|dool|r31c|soof|t10e|t11b|tool|r71k)',
    ]
    
    for p in unmatched_products:
        slug = p['slug']
        is_garbage = any(re.match(pat, slug) for pat in garbage_patterns)
        
        if slug == 'montblanc-jarod-c41zq-56019-145-2n':
            # This is actually an Andy Brook product, move it
            result = db_update('products', {'id': f'eq.{p["id"]}'}, {
                'brand_id': BRAND_IDS['andy-brook'],
                'name': 'Andy Brook Jarod C41ZQ',
                'slug': 'andy-brook-jarod-c41zq',
            })
            if result:
                print(f"  🔄 {slug} → Déplacé vers Andy Brook")
        elif slug == 'cartier-c-04530-001':
            # Likely CT0453O-001
            entries = style_data.get('CT0453O', [])
            if entries:
                e = entries[0]
                name = f"Cartier {e['style']}"
                new_slug = slugify(f"cartier-{e['style']}")
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': new_slug,
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                    'frame_material': map_material(e['main_material']),
                    'frame_color': e['front_color'].capitalize() if e['front_color'] else None,
                })
                print(f"  ✅ {slug} → {name} (CT0453O corrigé)")
            else:
                print(f"  ⚠️ {slug} — CT0453O non trouvé dans Excel, gardé tel quel")
        elif slug == 'saint-laurent-se-m150-006':
            # Likely SL M150
            entries = style_data.get('SLM150/F', []) or style_data.get('SLM150', [])
            if not entries:
                # Search more broadly
                for sn, ents in style_data.items():
                    if 'M150' in sn and ents[0]['brand_code'] == 'SLP':
                        entries = ents
                        break
            if entries:
                e = entries[0]
                name = f"Saint Laurent {e['style']}"
                new_slug = slugify(f"saint-laurent-{e['style']}")
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': new_slug,
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                })
                print(f"  ✅ {slug} → {name}")
            else:
                print(f"  ⚠️ {slug} — Non trouvé dans Excel")
        elif 'sl-mt46' in slug or 'sl-mtts' in slug:
            # These styles aren't in the Kering file, but keep them
            # Just update with a clean name
            if 'mt46' in slug:
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': 'Saint Laurent SL MT46 OPT',
                    'slug': 'saint-laurent-sl-mt46-opt',
                    'category': 'vue',
                })
                print(f"  ⚠️ {slug} → Saint Laurent SL MT46 OPT (pas dans Excel, nom nettoyé)")
            else:
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': 'Saint Laurent SL MTTS',
                    'slug': 'saint-laurent-sl-mtts',
                    'category': 'soleil',
                })
                print(f"  ⚠️ {slug} → Saint Laurent SL MTTS (pas dans Excel, nom nettoyé)")
        elif 'cto439s' in slug:
            entries = style_data.get('CT0439S', [])
            if entries:
                e = entries[0]
                name = f"Cartier {e['style']}"
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': slugify(f"cartier-{e['style']}"),
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                    'frame_material': map_material(e['main_material']),
                })
                print(f"  ✅ {slug} → {name}")
        elif 'cto464s' in slug:
            entries = style_data.get('CT0464S', [])
            if entries:
                e = entries[0]
                name = f"Cartier {e['style']}"
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': slugify(f"cartier-{e['style']}"),
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                    'frame_material': map_material(e['main_material']),
                })
                print(f"  ✅ {slug} → {name}")
        elif 'cto5220' in slug:
            entries = style_data.get('CT0522O', [])
            if entries:
                e = entries[0]
                name = f"Cartier {e['style']}"
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': slugify(f"cartier-{e['style']}"),
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                    'frame_material': map_material(e['main_material']),
                })
                print(f"  ✅ {slug} → {name}")
        elif 'cto455oj' in slug:
            # Already handled by CT0455OJ match above probably — skip if it was a duplicate
            entries = style_data.get('CT0455OJ', [])
            if entries:
                e = entries[0]
                name = f"Cartier {e['style']}"
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': slugify(f"cartier-{e['style']}-alt"),
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                })
                print(f"  ✅ {slug} → {name} (doublon CT0455OJ)")
        elif 'ggizzto' in slug:
            # OCR error - can't determine the real model
            print(f"  ⚠️ {slug} — Référence illisible (erreur OCR), gardé tel quel")
        elif is_garbage:
            # Keep but mark with a note
            print(f"  ⚠️ {slug} — Référence non identifiable, gardé (a des photos)")
        elif 'mb2410001' in slug:
            # Montblanc MB0241O maybe?
            entries = style_data.get('MB0241O', [])
            if entries:
                e = entries[0]
                name = f"Montblanc {e['style']}"
                db_update('products', {'id': f'eq.{p["id"]}'}, {
                    'name': name,
                    'slug': slugify(f"montblanc-{e['style']}"),
                    'base_price': float(e['srp']) if e['srp'] else 0,
                    'category': map_category(e['category']),
                    'gender': map_gender(e['gender']),
                })
                print(f"  ✅ {slug} → {name}")
            else:
                print(f"  ⚠️ {slug} — Pas trouvé dans Excel")
        else:
            print(f"  ⚠️ {slug} — Non matché, gardé tel quel")
    
    # ─── Phase 5: Create Bottega Veneta brand ───
    print("\n🏷️ Phase 5: Vérification marque Bottega Veneta...")
    existing_brands = db_select('brands', {'select': 'id,name,slug', 'slug': 'eq.bottega-veneta'})
    if not existing_brands:
        new_brand = db_insert('brands', {
            'name': 'Bottega Veneta',
            'slug': 'bottega-veneta',
            'is_active': True,
            'sort_order': 0,
        })
        if new_brand:
            print(f"  ✅ Bottega Veneta créée (ID: {new_brand[0]['id']})")
    else:
        print(f"  ℹ️ Bottega Veneta existe déjà (ID: {existing_brands[0]['id']})")
    
    # ─── Summary ───
    print(f"\n{'='*60}")
    print(f"  📊 RÉSUMÉ DU NETTOYAGE")
    print(f"{'='*60}")
    print(f"  Produits mis à jour:  {updated}")
    print(f"  Doublons fusionnés:   {len(deleted_ids)}")
    print(f"  Non-matchés traités:  {len(unmatched_products)}")
    print(f"  Bottega Veneta:       {'Créée' if not existing_brands else 'Existante'}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()

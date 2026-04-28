#!/usr/bin/env python3
"""
Second pass: fix remaining unmatched Kering products.
The issue is O/0 confusion in slugs (e.g., CT0061O → ct00610).
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

EXCEL_FILE = Path(__file__).parent.parent / 'Price_List_ NOUVEAU TARIF KERINGEYEWEAR AVRIL 2026.xlsx'

BRAND_IDS = {
    'cartier': '78ef5a1d-1f67-4231-996e-feed6d608f00',
    'gucci': '7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1',
    'saint-laurent': '5e06fafa-f165-4e1c-80a1-d9b9e065d56c',
    'montblanc': '82cb62c5-deb0-4131-aa64-3b150e832d83',
}

KERING_BRAND_CODES = {'GUC': 'gucci', 'CTR': 'cartier', 'SLP': 'saint-laurent', 'MMM': 'montblanc'}
BRAND_NAMES = {'cartier': 'Cartier', 'gucci': 'Gucci', 'saint-laurent': 'Saint Laurent', 'montblanc': 'Montblanc'}

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

def db_update(table, match_params, data):
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

def db_insert(table, data):
    return api_request('POST', table, data=data)

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower().replace('/', '-')).strip('-')[:100]

def map_gender(g):
    g = g.lower()
    if g in ('man', 'male'): return 'homme'
    if g in ('woman', 'female'): return 'femme'
    return 'mixte'

def map_category(c):
    return 'soleil' if c == 'SUN' else 'vue'

def map_material(m):
    m = m.upper()
    if 'METAL' in m: return 'metal'
    if 'ACETATE' in m or 'INJECTED' in m: return 'acetate'
    if 'TITANIUM' in m: return 'titane'
    if 'COMBINED' in m: return 'combiné'
    return m.lower() if m else None

# ─── Load Excel ───
print("📊 Chargement Excel...")
wb = openpyxl.load_workbook(str(EXCEL_FILE))
ws = wb.active

# Build MULTIPLE lookups
style_entries = defaultdict(list)  # style_norm -> entries
style_by_brand = defaultdict(dict)  # brand_code -> {style_norm: entries}

for row in ws.iter_rows(min_row=2, max_col=26):
    brand_code = row[4].value
    if brand_code not in KERING_BRAND_CODES:
        continue
    
    style = str(row[7].value or '').strip()
    variant = str(row[8].value or '').strip()
    style_norm = re.sub(r'\s+', '', style).upper()
    
    entry = {
        'brand_code': brand_code,
        'sku': str(row[5].value or '').strip(),
        'style': style, 'variant': variant,
        'style_norm': style_norm,
        'ean': str(row[10].value or '').strip(),
        'category': str(row[6].value or '').strip(),
        'front_color': str(row[11].value or '').strip(),
        'lens_color': str(row[13].value or '').strip(),
        'main_material': str(row[15].value or '').strip(),
        'gender': str(row[16].value or '').strip(),
        'srp': row[24].value,
    }
    style_entries[style_norm].append(entry)
    style_by_brand[brand_code][style_norm] = style_entries[style_norm]

print(f"  ✅ Chargé")

# ─── Smart matching with O/0 awareness ───
def smart_match(slug, brand_slug):
    """Match a slug to Kering data with O/0 confusion handling."""
    ref = slug[len(brand_slug)+1:].upper().replace('-', '')
    brand_code = {'cartier': 'CTR', 'gucci': 'GUC', 'saint-laurent': 'SLP', 'montblanc': 'MMM'}[brand_slug]
    brand_styles = style_by_brand.get(brand_code, {})
    
    # Strategy 1: For references like CT00610002 → try CT0061O 002
    # The pattern: brand_prefix + digits + O/S/OA/SA/SK/OJ suffix
    # In slugs, the O/S suffix gets merged with variant numbers
    
    # Known prefixes
    prefixes = {
        'CTR': ['CT', 'CRT', 'CRE', 'CR'],
        'GUC': ['GG'],
        'SLP': ['SL'],
        'MMM': ['MB'],
    }
    
    for prefix in prefixes.get(brand_code, []):
        if not ref.startswith(prefix):
            continue
        after_prefix = ref[len(prefix):]
        
        # Try different O/0 substitutions at various positions
        # Common patterns:
        # CT0061O → in slug ct00610 → after prefix = 00610002 (with variant 002)
        # GG1221O → in slug gg12210 → after prefix = 12210001
        # MB0279O → in slug mb02790 → after prefix = 02790001
        
        # Try: insert O/S/OA/SA/SK/OJ at each position where 0 appears
        suffixes_to_try = ['O', 'S', 'OA', 'SA', 'SK', 'OJ']
        
        for i in range(3, min(len(after_prefix), 8)):
            digit_part = after_prefix[:i]
            rest = after_prefix[i:]
            
            for suffix in suffixes_to_try:
                # Replace last char(s) with suffix
                if len(digit_part) >= 1:
                    # Style = prefix + digit_part[:-1] + suffix
                    candidate_style = prefix + digit_part[:-len(suffix)] + suffix if len(suffix) <= len(digit_part) else None
                    if not candidate_style:
                        continue
                    
                    if candidate_style in brand_styles:
                        entries = brand_styles[candidate_style]
                        # Try to match variant
                        variant_part = rest or digit_part[-3:] if len(digit_part) >= 3 else None
                        variant_match = re.match(r'^0?(\d{2,3})', rest) if rest else None
                        variant_num = variant_match.group(0).zfill(3) if variant_match else None
                        
                        best = entries[0]
                        if variant_num:
                            for e in entries:
                                if e['variant'].endswith(variant_num):
                                    best = e
                                    break
                        return best, candidate_style
        
        # Also try the exact digits + O/S at end
        # e.g., after_prefix = "09580005" → try GG0958O with variant 005
        for suffix in suffixes_to_try:
            for split_pos in range(3, min(8, len(after_prefix))):
                candidate = prefix + after_prefix[:split_pos-len(suffix)+1] + suffix
                if candidate in brand_styles:
                    entries = brand_styles[candidate]
                    rest = after_prefix[split_pos-len(suffix)+1+len(suffix):]
                    variant_match = re.match(r'^0?(\d{2,3})', rest) if rest else None
                    variant_num = variant_match.group(0).zfill(3) if variant_match else None
                    best = entries[0]
                    if variant_num:
                        for e in entries:
                            if e['variant'].endswith(variant_num):
                                best = e
                                break
                    return best, candidate
    
    # Strategy 2: Fuzzy match - for each style, check if ref contains it
    best_match = None
    best_score = 0
    best_sn = None
    
    for sn, entries in brand_styles.items():
        # Replace O with 0 in style_norm and check if that's in ref
        sn_zero = sn.replace('O', '0')
        
        if sn in ref:
            score = len(sn)
            if score > best_score:
                best_score = score
                best_sn = sn
                best_match = entries[0]
        elif sn_zero in ref and sn_zero != sn:
            score = len(sn_zero)
            if score > best_score:
                best_score = score
                best_sn = sn
                best_match = entries[0]
    
    if best_match:
        return best_match, best_sn
    
    return None, None

# ─── Get remaining unmatched products ───
print("\n📦 Récupération des produits encore non nettoyés...")

kering_brand_ids = list(BRAND_IDS.values())
products = api_request('GET', 'products', params={
    'select': 'id,name,slug,category,gender,base_price,brand_id,frame_material,frame_color',
    'brand_id': f'in.({",".join(kering_brand_ids)})',
    'order': 'slug',
})

# Filter: only products still with price 0 or with messy names
still_dirty = [p for p in products if p['base_price'] == 0 or p['base_price'] is None]
print(f"  {len(still_dirty)} produits encore à prix 0€ (non nettoyés)")

brand_slug_map = {v: k for k, v in BRAND_IDS.items()}
updated = 0
still_unmatched = []

for p in still_dirty:
    brand_slug = brand_slug_map.get(p['brand_id'])
    if not brand_slug or brand_slug not in BRAND_IDS:
        continue
    
    match, style_norm = smart_match(p['slug'], brand_slug)
    
    if match:
        brand_name = BRAND_NAMES[brand_slug]
        style_name = match['style']
        new_name = f"{brand_name} {style_name}"
        new_slug = slugify(f"{brand_name}-{style_name}")
        
        # Check for slug collision
        existing_slugs = [pp['slug'] for pp in products if pp['id'] != p['id']]
        if new_slug in existing_slugs:
            # Add variant to disambiguate
            variant_code = match['variant'].split('-')[-1] if '-' in match['variant'] else match['variant'][-3:]
            new_slug = slugify(f"{brand_name}-{style_name}-{variant_code}")
        
        # If still collision, this is a duplicate - will handle separately
        if new_slug in existing_slugs:
            new_slug = slugify(f"{brand_name}-{style_name}-v{p['slug'][-3:]}")
        
        srp = float(match['srp']) if match['srp'] else 0
        
        update = {
            'name': new_name,
            'slug': new_slug,
            'base_price': srp,
            'category': map_category(match['category']),
            'gender': map_gender(match['gender']),
            'frame_material': map_material(match['main_material']) if match['main_material'] else None,
            'frame_color': match['front_color'].capitalize() if match['front_color'] else None,
        }
        
        result = db_update('products', {'id': f'eq.{p["id"]}'}, update)
        if result:
            updated += 1
            print(f"  ✅ {p['slug']:55s} → {new_name} | {srp}€ | {update['category']} | {update['gender']}")
            
            # Update variant SKU and color
            variants = api_request('GET', 'product_variants', params={
                'select': 'id',
                'product_id': f'eq.{p["id"]}',
                'limit': '1',
            })
            if variants:
                db_update('product_variants', {'id': f'eq.{variants[0]["id"]}'}, {
                    'sku': match['sku'] or match['variant'],
                    'color_name': match['front_color'].capitalize() if match['front_color'] else None,
                })
        else:
            still_unmatched.append(p['slug'])
    else:
        still_unmatched.append(p['slug'])

print(f"\n📊 Second pass: {updated} produits mis à jour")
if still_unmatched:
    print(f"⚠️  Encore {len(still_unmatched)} non-matchés:")
    for s in still_unmatched:
        print(f"    {s}")

#!/usr/bin/env python3
"""Fix remaining issues: duplicate names, wrong matches."""

import json
import urllib.request
import urllib.parse
from pathlib import Path
from collections import defaultdict

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

def merge_product(dup_slug, main_slug, label):
    """Merge dup into main, transfer images, delete dup."""
    dup_prods = api_get('products', {'select': 'id', 'slug': f'eq.{dup_slug}'})
    main_prods = api_get('products', {'select': 'id,name', 'slug': f'eq.{main_slug}'})
    if not dup_prods or not main_prods:
        print(f"  ⏭️ {label}: un des deux pas trouvé")
        return
    
    dup_id = dup_prods[0]['id']
    main_id = main_prods[0]['id']
    main_name = main_prods[0]['name']
    
    dup_images = api_get('product_images', {'select': 'id,sort_order', 'product_id': f'eq.{dup_id}'})
    main_images = api_get('product_images', {'select': 'id,sort_order', 'product_id': f'eq.{main_id}'})
    max_sort = max((img.get('sort_order', 0) or 0) for img in main_images) + 1 if main_images else 0
    
    new_variant = api_post('product_variants', {
        'product_id': main_id,
        'sku': f'{main_name.split()[-1]}-{label}',
        'color_name': label,
        'stock_quantity': 1,
        'is_active': True,
    })
    variant_id = new_variant[0]['id'] if new_variant else None
    
    for i, img in enumerate(dup_images):
        api_patch('product_images', {'id': f'eq.{img["id"]}'}, {
            'product_id': main_id,
            'variant_id': variant_id,
            'sort_order': max_sort + i,
            'is_primary': False,
            'alt_text': f"{main_name} {label} - Photo {i+1}"
        })
    
    dup_variants = api_get('product_variants', {'select': 'id', 'product_id': f'eq.{dup_id}'})
    for dv in dup_variants:
        api_delete('product_variants', {'id': f'eq.{dv["id"]}'})
    
    api_delete('products', {'id': f'eq.{dup_id}'})
    print(f"  ✅ {label}: {dup_slug} → fusionné dans {main_slug}")

print("🔧 Corrections finales...\n")

# 1. Fix "Montblanc MB0355S 002 49020・145 XL" → merge into "Montblanc MB0355S"
print("1. Montblanc MB0355S doublon:")
old_mb = api_get('products', {'select': 'id,slug', 'slug': 'eq.montblanc-mb0355s-002-49020-145-xl'})
if old_mb:
    merge_product('montblanc-mb0355s-002-49020-145-xl', 'montblanc-mb0355s', 'Variante 002')
else:
    print("  ⏭️ Déjà traité")

# 2. Fix duplicate Cartier CT0455OJ
print("\n2. Cartier CT0455OJ doublon:")
ct_dupes = api_get('products', {'select': 'id,slug,name', 'name': 'eq.Cartier CT0455OJ', 'order': 'created_at'})
if len(ct_dupes) > 1:
    merge_product(ct_dupes[1]['slug'], ct_dupes[0]['slug'], 'Variante 2')
else:
    print(f"  ⏭️ Pas de doublon (count={len(ct_dupes)})")

# 3. Fix duplicate Gucci GG1854S  
print("\n3. Gucci GG1854S doublon:")
gg_dupes = api_get('products', {'select': 'id,slug,name', 'name': 'eq.Gucci GG1854S', 'order': 'created_at'})
if len(gg_dupes) > 1:
    merge_product(gg_dupes[1]['slug'], gg_dupes[0]['slug'], 'Variante 003')
else:
    print(f"  ⏭️ Pas de doublon (count={len(gg_dupes)})")

# 4. Fix SL 7 → should be SL 782/K
print("\n4. Saint Laurent SL 7 → SL 782/K:")
sl7 = api_get('products', {'select': 'id,slug', 'slug': 'eq.saint-laurent-sl-7'})
if sl7:
    api_patch('products', {'id': f'eq.{sl7[0]["id"]}'}, {
        'name': 'Saint Laurent SL 782/K',
        'slug': 'saint-laurent-sl-782-k',
        'base_price': 270,
        'category': 'vue',
        'gender': 'femme',
    })
    print("  ✅ SL 7 → Saint Laurent SL 782/K | 270€ | vue | femme")
else:
    print("  ⏭️ Non trouvé")

# 5. Fix SL M9 → SL M95/F
print("\n5. Saint Laurent SL M9 → SL M95/F:")
slm9 = api_get('products', {'select': 'id,slug', 'slug': 'eq.saint-laurent-sl-m9'})
if slm9:
    api_patch('products', {'id': f'eq.{slm9[0]["id"]}'}, {
        'name': 'Saint Laurent SL M95/F',
        'slug': 'saint-laurent-sl-m95-f',
        'base_price': 440,
        'category': 'soleil',
        'gender': 'femme',
    })
    print("  ✅ SL M9 → Saint Laurent SL M95/F | 440€ | soleil | femme")
else:
    print("  ⏭️ Non trouvé")

# 6. Fix Gucci GG1853O → GG1853S (matched wrong - it's actually soleil not vue)  
# Actually GG18530 → could be GG1853O (vue) or GG1853S (soleil), let me check by slug
print("\n6. Vérification Gucci GG1853O/GG1853S:")
gg1853o = api_get('products', {'select': 'id,slug,name,category', 'slug': 'eq.gucci-gg1853o'})
gg1853s = api_get('products', {'select': 'id,slug,name,category', 'slug': 'eq.gucci-gg1853s'})
if gg1853o:
    print(f"  GG1853O: {gg1853o[0]['name']} | {gg1853o[0]['category']}")
if gg1853s:
    print(f"  GG1853S: {gg1853s[0]['name']} | {gg1853s[0]['category']}")
# These are different models (O=optical, S=sun), both legitimate

# 7. Update MB0355S price from 290 to proper SRP 350€
print("\n7. Fix MB0355S price:")
mb355 = api_get('products', {'select': 'id,slug,base_price', 'slug': 'eq.montblanc-mb0355s'})
if mb355:
    api_patch('products', {'id': f'eq.{mb355[0]["id"]}'}, {'base_price': 350})
    print(f"  ✅ MB0355S: {mb355[0]['base_price']}€ → 350€ (prix SRP correct)")

# 8. Fix GG1854S: 480€ one should be merged into 440€ one (Excel says 440€)
print("\n8. Gucci GG1854S doublon (480€ → 440€):")
gg_dupes = api_get('products', {'select': 'id,slug,name,base_price', 'name': 'eq.Gucci GG1854S', 'order': 'created_at'})
if len(gg_dupes) > 1:
    # Find the 480€ one and the 440€ one
    keep = next((g for g in gg_dupes if g['base_price'] == 440), gg_dupes[-1])
    dup = next((g for g in gg_dupes if g['id'] != keep['id']), None)
    if dup:
        merge_product(dup['slug'], keep['slug'], 'Variante 003')
else:
    print(f"  ⏭️ Pas de doublon (count={len(gg_dupes)})")

print("\n✅ Corrections terminées!")

# Final count
all_prods = api_get('products', {
    'select': 'id,name,base_price,brand_id',
    'brand_id': 'in.(78ef5a1d-1f67-4231-996e-feed6d608f00,7a92b1ac-1c56-4dc5-b892-a6dca76cb1b1,5e06fafa-f165-4e1c-80a1-d9b9e065d56c,82cb62c5-deb0-4131-aa64-3b150e832d83)',
})
with_price = sum(1 for p in all_prods if p['base_price'] and p['base_price'] > 0)
print(f"\n📊 FINAL: {len(all_prods)} produits Kering | {with_price} avec prix | {len(all_prods)-with_price} sans prix")

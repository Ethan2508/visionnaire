#!/usr/bin/env python3
"""Match existing site products against Kering Excel price list."""

import openpyxl
import re
from collections import defaultdict

# Load Kering price list
wb = openpyxl.load_workbook('Price_List_ NOUVEAU TARIF KERINGEYEWEAR AVRIL 2026.xlsx')
ws = wb.active

KERING_BRANDS = {'GUC', 'CTR', 'SLP', 'BTV', 'MMM'}

# Build lookup: style_name (normalized) -> list of variants
style_variants = defaultdict(list)

for row in ws.iter_rows(min_row=2, max_col=26):
    brand = row[4].value
    if brand not in KERING_BRANDS:
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

    # Normalize style: remove spaces, uppercase
    style_norm = re.sub(r'\s+', '', style).upper()
    
    entry = {
        'brand': brand, 'sku': sku, 'style': style, 'variant': variant,
        'style_norm': style_norm, 'ean': ean, 'category': cat,
        'front_color': front_color, 'temple_color': temple_color,
        'lens_color': lens_color, 'lens_material': lens_material,
        'main_material': main_material, 'gender': gender,
        'fitting': fitting, 'srp': srp, 'whs': whs
    }
    style_variants[style_norm].append(entry)

# Also build by style+variant
sku_lookup = {}
for entries in style_variants.values():
    for e in entries:
        key = e['style_norm'] + e['variant']
        sku_lookup[key] = e

print(f"Loaded {sum(len(v) for v in style_variants.values())} SKUs for {len(style_variants)} styles\n")

# Site products
site_slugs = {
    'cartier': [
        "cartier-c-04530-001", "cartier-ct00520-008", "cartier-ct00580-002",
        "cartier-ct00610-002", "cartier-ct00610-003", "cartier-ct00920-001",
        "cartier-ct01200-001", "cartier-ct02810-001", "cartier-ct02810-004",
        "cartier-ct02870-009", "cartier-ct02900-003", "cartier-ct04070",
        "cartier-ct04550j-001", "cartier-ct0455oj-001", "cartier-ct04940-001",
        "cartier-ct0472s-001", "cartier-ct0500s-003", "cartier-ct05210-002",
        "cartier-ct0536s-003", "cartier-ct05630-002", "cartier-cto439s-001",
        "cartier-cto455oj-001", "cartier-cto464s-004", "cartier-cto5220-002",
        "cartier-fool711690", "cartier-g77k62bk", "cartier-ho2k89gz",
    ],
    'gucci': [
        "gucci-b01hm16310", "gucci-gg-16870-02", "gucci-gg-18545-003",
        "gucci-gg09580-005", "gucci-gg10725", "gucci-gg12210-001",
        "gucci-gg12210-004", "gucci-gg12210-005", "gucci-gg13430-001",
        "gucci-gg1421s-009", "gucci-gg1722sa-001", "gucci-gg1730s-001",
        "gucci-gg1746oa", "gucci-gg17910-005", "gucci-gg1805sa",
        "gucci-gg1808s-003", "gucci-gg18500-003", "gucci-gg18530-001",
        "gucci-gg1853s-002", "gucci-gg1854s", "gucci-gg18565",
        "gucci-gg18768-002", "gucci-gg18780-002", "gucci-gg18815-004",
        "gucci-gg18820-002", "gucci-gg1887s", "gucci-gg1892s-003",
        "gucci-gg1897sk", "gucci-gg1923sa-001", "gucci-gg1968s-001-50",
        "gucci-gg19690-001-51", "gucci-gg1970sa-003-54", "gucci-gg19720a-003",
        "gucci-ggizzto-006", "gucci-t11g611130", "gucci-tfc1174748",
    ],
    'saint-laurent': [
        "saint-laurent-d01em38750", "saint-laurent-doolu75640",
        "saint-laurent-r31cq25450", "saint-laurent-se-m150-006",
        "saint-laurent-sl-312-m-014", "saint-laurent-sl-557-shade-001",
        "saint-laurent-sl-572-001", "saint-laurent-sl-665-002",
        "saint-laurent-sl-692-002", "saint-laurent-sl-692-003",
        "saint-laurent-sl-703-002", "saint-laurent-sl-706-002",
        "saint-laurent-sl-708-opi-032", "saint-laurent-sl-708-opt",
        "saint-laurent-sl-722-001-49", "saint-laurent-sl-737-mica-thin-opt",
        "saint-laurent-sl-782-k-003", "saint-laurent-sl-792-003",
        "saint-laurent-sl-819-003", "saint-laurent-sl-m119-blaze-002",
        "saint-laurent-sl-m3-002", "saint-laurent-sl-m94-rim-001",
        "saint-laurent-sl-m95-f-001", "saint-laurent-sl-mt46-opt-003",
        "saint-laurent-sl-mtts-003", "saint-laurent-sl157-009",
        "saint-laurent-sl740-004", "saint-laurent-soofs11240",
        "saint-laurent-t10ey-22850", "saint-laurent-t11bp-41930",
        "saint-laurent-tool-4d3310",
    ],
    'montblanc': [
        "montblanc-jarod-c41zq-56019-145-2n",
        "montblanc-mb00990-004-48o21", "montblanc-mb0271s-006-5620-145",
        "montblanc-mb02790-001-54-0-20-145-l", "montblanc-mb02790-001-54020-145",
        "montblanc-mb02790-002-54020-145", "montblanc-mb03070-001-54020-145-xl",
        "montblanc-mb03100a-001-52021-145-xl", "montblanc-mb03100a-003-52021-145-xl",
        "montblanc-mb03400-001-50020-145-m", "montblanc-mb03420a-002-51020-145l",
        "montblanc-mb03460-002-53", "montblanc-mb0355s-001-49020-145",
        "montblanc-mb0355s-002-49020-145-xl", "montblanc-mb03580-010-53o19",
        "montblanc-mb03890-003-50022-145-m", "montblanc-mb03890-004-50",
        "montblanc-mb03910a-001-51021-145", "montblanc-mb03910a-002-81021-145",
        "montblanc-mb04110-001-55-j10-146-m", "montblanc-mb0435s-0015-51021-145",
        "montblanc-mb2410001-54-19-145", "montblanc-r71kl01450",
        "montblanc-tttaniom-mb0317oa-001",
    ],
}

brand_code_map = {'cartier': 'CTR', 'gucci': 'GUC', 'saint-laurent': 'SLP', 'montblanc': 'MMM'}

def extract_model_from_slug(brand_slug, slug):
    """Try to extract model reference from a product slug."""
    # Remove brand prefix
    ref = slug[len(brand_slug)+1:]
    # Uppercase
    ref = ref.upper()
    
    # Try to identify the style code pattern
    # Cartier: CT followed by digits and optional letter suffix
    # Gucci: GG followed by digits and optional letter suffix  
    # Saint Laurent: SL followed by digits/letters
    # Montblanc: MB followed by digits and optional letter suffix
    
    return ref

def try_match(brand_slug, slug, brand_code):
    """Try to match a site slug to a Kering style."""
    ref = slug[len(brand_slug)+1:].upper()
    
    # Clean up: replace multiple dashes with nothing (slug artifacts)
    ref_clean = ref.replace('-', '')
    
    # For each style in the brand, check if it matches
    best_match = None
    best_score = 0
    
    for style_norm, entries in style_variants.items():
        if entries[0]['brand'] != brand_code:
            continue
        
        # Method 1: style_norm is contained in the ref
        if style_norm in ref_clean:
            score = len(style_norm)
            if score > best_score:
                best_score = score
                # Try to extract variant from the remaining part
                remainder = ref_clean[ref_clean.index(style_norm)+len(style_norm):]
                # Variant is typically 3 digits like "001", "002"
                variant_match = re.match(r'^(\d{3})', remainder)
                variant = variant_match.group(1) if variant_match else None
                
                if variant:
                    # Find exact variant
                    for e in entries:
                        if e['variant'] == variant:
                            best_match = e
                            break
                if not best_match or best_score <= score:
                    best_match = entries[0]  # fallback to first variant
                    if variant:
                        best_match = dict(best_match)
                        best_match['_matched_variant'] = variant
                best_score = score
        
        # Method 2: ref starts with style_norm prefix  
        elif ref_clean.startswith(style_norm[:min(6, len(style_norm))]) and len(style_norm) >= 5:
            score = min(6, len(style_norm)) - 1
            if score > best_score:
                best_score = score
                best_match = entries[0]
    
    return best_match

# Run matching
total_matched = 0
total_products = 0
all_results = {}

for brand_slug, slugs in site_slugs.items():
    brand_code = brand_code_map[brand_slug]
    brand_name = {'cartier': 'CARTIER', 'gucci': 'GUCCI', 'saint-laurent': 'SAINT LAURENT', 'montblanc': 'MONTBLANC'}[brand_slug]
    
    print(f"\n{'='*70}")
    print(f"  {brand_name} ({brand_code}) — {len(slugs)} produits sur le site")
    print(f"{'='*70}")
    
    matched = 0
    unmatched = []
    results = []
    
    for slug in slugs:
        match = try_match(brand_slug, slug, brand_code)
        total_products += 1
        
        if match:
            matched += 1
            total_matched += 1
            srp = match['srp'] if match['srp'] else '?'
            cat_label = 'SOLEIL' if match['category'] == 'SUN' else 'VUE'
            print(f"  ✅ {slug}")
            print(f"     → {match['style']} {match['variant']} | {cat_label} | SRP: {srp}€ | {match['gender']} | {match['front_color']}")
            results.append({'slug': slug, 'match': match, 'status': 'matched'})
        else:
            unmatched.append(slug)
            results.append({'slug': slug, 'match': None, 'status': 'unmatched'})
    
    if unmatched:
        print(f"\n  ❌ NON MATCHÉS ({len(unmatched)}):")
        for u in unmatched:
            ref = u[len(brand_slug)+1:].upper()
            print(f"     {u}  →  ref: {ref}")
    
    print(f"\n  📊 Résultat: {matched}/{len(slugs)} matchés")
    all_results[brand_slug] = results

print(f"\n{'='*70}")
print(f"  TOTAL: {total_matched}/{total_products} produits Kering matchés")
print(f"{'='*70}")

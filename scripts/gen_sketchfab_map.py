#!/usr/bin/env python3
"""Generate src/data/sketchfab-map.ts from VISUELS 3D.xlsx"""

import openpyxl
from pathlib import Path

ROOT = Path(__file__).parent.parent
wb = openpyxl.load_workbook(ROOT / 'VISUELS 3D.xlsx', data_only=True)
ws = wb.active

# Build mapping: style -> sketchfab_uid (first per style)
mapping = {}
for row in ws.iter_rows(min_row=2, min_col=1, max_col=7):
    style = row[0].value
    uid = row[5].value
    if style and uid:
        style = str(style).strip()
        uid = str(uid).strip()
        if style not in mapping:
            mapping[style] = uid

wb.close()

# Write TypeScript file
out = ROOT / 'src' / 'data' / 'sketchfab-map.ts'
out.parent.mkdir(parents=True, exist_ok=True)

lines = [
    f'// Auto-generated from VISUELS 3D.xlsx — {len(mapping)} styles',
    '',
    'const sketchfabMap: Record<string, string> = {',
]
for style in sorted(mapping.keys()):
    lines.append(f'  "{style}": "{mapping[style]}",')
lines.append('};')
lines.append('')
lines.append('export function getSketchfabUid(productName: string): string | null {')
lines.append('  const parts = productName.split(" ");')
lines.append('  if (parts.length < 2) return null;')
lines.append('  const style = parts.slice(1).join(" ");')
lines.append('  return sketchfabMap[style] ?? null;')
lines.append('}')
lines.append('')
lines.append('export function getSketchfabEmbedUrl(uid: string): string {')
lines.append('  const params = [')
lines.append('    "ui_animations=0", "ui_infos=0", "ui_stop=0", "ui_inspector=0",')
lines.append('    "ui_watermark_link=0", "ui_watermark=0", "ui_ar=0", "ui_help=0",')
lines.append('    "ui_settings=0", "ui_vr=0", "ui_fullscreen=0", "ui_annotations=0",')
lines.append('    "autostart=1",')
lines.append('  ].join("&");')
lines.append('  return `https://sketchfab.com/models/${uid}/embed?${params}`;')
lines.append('}')
lines.append('')

out.write_text('\n'.join(lines))
print(f'✅ Generated {out} with {len(mapping)} styles')

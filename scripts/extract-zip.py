#!/usr/bin/env python3
"""
Extract zip handling non-UTF8 filenames (Windows CP437/Latin1 encoding).
Usage: python3 scripts/extract-zip.py <zip_path> <dest_dir>
"""
import zipfile, os, sys, unicodedata

zip_path = sys.argv[1]
dest = sys.argv[2]
extracted = 0
fixed = 0

with zipfile.ZipFile(zip_path, 'r') as zf:
    for info in zf.infolist():
        # Get filename, handle encoding
        try:
            name = info.filename
        except Exception:
            name = info.filename.encode('cp437').decode('utf-8', errors='replace')

        # Sanitize: replace control chars with underscores
        clean = ''
        for ch in name:
            cat = unicodedata.category(ch)
            if cat.startswith('C') and ch not in ('\n', '\r', '\t', '/'):
                clean += '_'
                fixed += 1
            else:
                clean += ch

        # Skip directories (just create them)
        if info.is_dir():
            os.makedirs(os.path.join(dest, clean), exist_ok=True)
            continue

        # Extract file
        target = os.path.join(dest, clean)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        try:
            with zf.open(info) as src, open(target, 'wb') as dst:
                dst.write(src.read())
            extracted += 1
        except Exception as e:
            print(f"  SKIP: {clean} ({e})", file=sys.stderr)

print(f"{extracted} fichiers extraits, {fixed} caracteres corriges")

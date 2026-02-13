#!/usr/bin/env node

/**
 * Script d'import du catalogue Visionnaire Opticiens
 * Utilise directement l'API REST Supabase (pas de SDK — évite les bugs ESM)
 *
 * Usage: node scripts/import-catalogue.mjs
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// ─── Config ───
const SUPABASE_URL = "https://odirisqsqpdvitisvdzn.supabase.co";
const SERVICE_KEY = "REDACTED";
const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const ZIP_PATH = path.resolve("Dossier Visionnaire-20260213T142029Z-1-001.zip");
const EXTRACT_DIR = "/tmp/visionnaire-import";
const BASE_DIR = path.join(EXTRACT_DIR, "Dossier Visionnaire");

// ─── Supabase REST helpers ───
async function dbSelect(table, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HEADERS });
  return res.json();
}

async function dbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || JSON.stringify(err));
  }
  return res.json();
}

async function storageUpload(bucket, filePath, fileBuffer, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: fileBuffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}

// ─── Mapping des noms de marques ───
const BRAND_MAP = {
  "Andy brook": "Andy Brook",
  "Cartier": "Cartier",
  "Dior femme": "Dior",
  "Dior homme": "Dior",
  "Fendi": "Fendi",
  "Fred": "Fred",
  "Gucci": "Gucci",
  "Miu miu": "Miu Miu",
  "Montblanc": "Montblanc",
  "Off white": "Off-White",
  "Off white ": "Off-White",
  "Palm angels": "Palm Angels",
  "Prada": "Prada",
  "Prada ": "Prada",
  "Spektre": "Spektre",
  "Spektre ": "Spektre",
  "Ysl": "Saint Laurent",
  "Ysl ": "Saint Laurent",
};

function parseCategory(folderName) {
  const lower = folderName.toLowerCase().trim();
  if (lower.includes("soleil") || lower === "solaire" || lower.startsWith("solaire")) return "soleil";
  if (lower.includes("vue") || lower === "vu") return "vue";
  return null;
}

function inferGender(brandFolder) {
  if (brandFolder === "Dior femme") return "femme";
  if (brandFolder === "Dior homme") return "homme";
  return "mixte";
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function getImages(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
    .sort()
    .map(f => path.join(dirPath, f));
}

// ─── Extraction via Python (gère les encodages non-UTF8) ───
function extractZip() {
  console.log("📦 Extraction du zip (via Python zipfile)...");
  if (fs.existsSync(EXTRACT_DIR)) execSync(`rm -rf "${EXTRACT_DIR}"`);
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });

  const pyScript = path.resolve("scripts/extract-zip.py");
  const result = execSync(`python3 "${pyScript}" "${ZIP_PATH}" "${EXTRACT_DIR}"`, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  });
  console.log(`  📁 ${result.trim()}`);
  console.log("✅ Extraction terminée");
}

// ─── Conversion HEIC ───
function convertHeicFiles() {
  console.log("🔄 Conversion HEIC → JPG...");
  let count = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name.toLowerCase().endsWith(".heic")) {
        const jpgPath = full.replace(/\.heic$/i, ".jpg");
        try {
          execSync(`sips -s format jpeg "${full}" --out "${jpgPath}"`, { stdio: "pipe" });
          fs.unlinkSync(full);
          count++;
        } catch { console.warn(`  ⚠️ Échec conversion ${entry.name}`); }
      }
    }
  }
  walk(BASE_DIR);
  console.log(`✅ ${count} HEIC convertis`);
}

// ─── Scan ───
function scanCatalogue() {
  console.log("🔍 Scan du catalogue...");
  const products = [];
  const brandFolders = fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

  for (const brandFolder of brandFolders) {
    const brandName = BRAND_MAP[brandFolder] || BRAND_MAP[brandFolder.trim()] || brandFolder.trim();
    const brandPath = path.join(BASE_DIR, brandFolder);
    const gender = inferGender(brandFolder);
    const subFolders = fs.readdirSync(brandPath, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

    for (const subFolder of subFolders) {
      const subPath = path.join(brandPath, subFolder);
      const category = parseCategory(subFolder);

      if (category) {
        // Standard: Marque / Catégorie / Référence / photos
        const refFolders = fs.readdirSync(subPath, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        for (const refFolder of refFolders) {
          const images = getImages(path.join(subPath, refFolder));
          if (images.length > 0) products.push({ brandName, brandFolder, gender, category, reference: refFolder.trim(), images });
        }
        // Images directement dans le dossier catégorie
        const directImages = getImages(subPath);
        if (directImages.length > 0) products.push({ brandName, brandFolder, gender, category, reference: subFolder.trim(), images: directImages });
      } else {
        // Palm Angels: Marque / Référence / photos
        const images = getImages(subPath);
        if (images.length > 0) products.push({ brandName, brandFolder, gender, category: "soleil", reference: subFolder.trim(), images });
      }
    }
  }
  console.log(`✅ ${products.length} produits trouvés`);
  return products;
}

// ─── Import ───
async function importToDB(products) {
  console.log("\n🚀 Import en base de données...\n");

  // 1. Marques
  const uniqueBrands = [...new Set(products.map(p => p.brandName))];
  const brandIds = {};

  for (const brandName of uniqueBrands) {
    const slug = slugify(brandName);
    const existing = await dbSelect("brands", `slug=eq.${slug}&select=id`);
    if (existing.length > 0) {
      brandIds[brandName] = existing[0].id;
      console.log(`  ✓ Marque "${brandName}" existe déjà`);
    } else {
      try {
        const [row] = await dbInsert("brands", { name: brandName, slug, is_active: true });
        brandIds[brandName] = row.id;
        console.log(`  ✅ Marque "${brandName}" créée`);
      } catch (e) {
        console.error(`  ❌ Erreur marque "${brandName}": ${e.message}`);
      }
    }
  }

  // 2. Produits
  let created = 0, skipped = 0, imgUploaded = 0;

  for (const product of products) {
    const brandId = brandIds[product.brandName];
    if (!brandId) { skipped++; continue; }

    const productName = `${product.brandName} ${product.reference}`;
    const productSlug = slugify(productName);

    // Doublon ?
    const existing = await dbSelect("products", `slug=eq.${productSlug}&select=id`);
    if (existing.length > 0) { skipped++; continue; }

    // Créer produit
    let newProduct;
    try {
      [newProduct] = await dbInsert("products", {
        name: productName,
        slug: productSlug,
        category: product.category,
        gender: product.gender,
        brand_id: brandId,
        base_price: 0,
        is_active: true,
        requires_prescription: product.category === "vue",
      });
    } catch (e) {
      console.error(`  ❌ Produit "${productName}": ${e.message}`);
      skipped++;
      continue;
    }

    // Variante par défaut
    let variant;
    try {
      [variant] = await dbInsert("product_variants", {
        product_id: newProduct.id,
        sku: productSlug,
        color_name: "Default",
        stock_quantity: 1,
        is_active: true,
      });
    } catch (e) {
      console.warn(`  ⚠️ Variante pour "${productName}": ${e.message}`);
    }

    // Images
    for (let i = 0; i < product.images.length; i++) {
      const imgPath = product.images[i];
      const ext = path.extname(imgPath).toLowerCase();
      const storagePath = `${productSlug}/${i}${ext}`;
      const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

      try {
        const fileBuffer = fs.readFileSync(imgPath);
        const publicUrl = await storageUpload("products", storagePath, fileBuffer, contentType);

        await dbInsert("product_images", {
          product_id: newProduct.id,
          variant_id: variant?.id || null,
          url: publicUrl,
          alt_text: `${productName} - Photo ${i + 1}`,
          sort_order: i,
          is_primary: i === 0,
        });
        imgUploaded++;
      } catch (e) {
        console.warn(`    ⚠️ Image ${i}: ${e.message.substring(0, 80)}`);
      }
    }

    created++;
    if (created % 10 === 0) console.log(`  📸 ${created} produits / ${imgUploaded} images...`);
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Import terminé !`);
  console.log(`   ${uniqueBrands.length} marques`);
  console.log(`   ${created} produits créés`);
  console.log(`   ${imgUploaded} images uploadées`);
  console.log(`   ${skipped} ignorés (doublons/erreurs)`);
  console.log(`═══════════════════════════════════\n`);
  console.log(`⚠️  Complète les PRIX dans /admin/produits !`);
}

// ─── Main ───
async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  IMPORT CATALOGUE VISIONNAIRE         ║");
  console.log("╚═══════════════════════════════════════╝\n");

  if (!fs.existsSync(ZIP_PATH)) { console.error("❌ Zip introuvable:", ZIP_PATH); process.exit(1); }

  extractZip();
  convertHeicFiles();
  const products = scanCatalogue();
  await importToDB(products);
}

main().catch(console.error);

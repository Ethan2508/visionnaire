"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";

interface ImportRow {
  name: string;
  category: string;
  brand: string;
  price: string;
  gender: string;
  frame_shape: string;
  frame_material: string;
  frame_color: string;
  color_name: string;
  color_hex: string;
  size: string;
  stock: string;
  description: string;
}

interface ImportResult {
  total: number;
  success: number;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 10)); // Show first 10 rows as preview
    };
    reader.readAsText(f);
  }

  function parseCSV(text: string): ImportRow[] {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(";").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    return lines.slice(1).map((line) => {
      const values = line.split(";").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return {
        name: row["name"] || row["nom"] || "",
        category: row["category"] || row["categorie"] || "vue",
        brand: row["brand"] || row["marque"] || "",
        price: row["price"] || row["prix"] || "0",
        gender: row["gender"] || row["genre"] || "mixte",
        frame_shape: row["frame_shape"] || row["forme"] || "",
        frame_material: row["frame_material"] || row["materiau"] || "",
        frame_color: row["frame_color"] || row["couleur_monture"] || "",
        color_name: row["color_name"] || row["couleur"] || "Defaut",
        color_hex: row["color_hex"] || row["hex"] || "#000000",
        size: row["size"] || row["taille"] || "",
        stock: row["stock"] || "0",
        description: row["description"] || "",
      };
    });
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      const supabase = createClient();
      const errors: string[] = [];
      let success = 0;

      // Charger les marques existantes
      const { data: existingBrands } = (await supabase
        .from("brands")
        .select("id, name")) as { data: { id: string; name: string }[] | null };

      const brandMap = new Map<string, string>();
      (existingBrands || []).forEach((b) => brandMap.set(b.name.toLowerCase(), b.id));

      // Grouper par nom de produit (un produit peut avoir plusieurs variantes)
      const productGroups = new Map<string, ImportRow[]>();
      rows.forEach((row) => {
        if (!row.name) return;
        const key = row.name.toLowerCase();
        if (!productGroups.has(key)) productGroups.set(key, []);
        productGroups.get(key)!.push(row);
      });

      for (const [, groupRows] of productGroups) {
        const first = groupRows[0];

        try {
          // Creer la marque si elle n'existe pas
          let brandId: string | null = null;
          if (first.brand) {
            const brandKey = first.brand.toLowerCase();
            if (brandMap.has(brandKey)) {
              brandId = brandMap.get(brandKey)!;
            } else {
              const { data: newBrand } = (await supabase
                .from("brands")
                .insert({
                  name: first.brand,
                  slug: slugify(first.brand),
                  is_active: true,
                } as never)
                .select("id")
                .single()) as { data: { id: string } | null };
              if (newBrand) {
                brandId = newBrand.id;
                brandMap.set(brandKey, newBrand.id);
              }
            }
          }

          // Valider la categorie
          const validCategories = ["vue", "soleil", "ski", "sport", "enfant"];
          const category = validCategories.includes(first.category) ? first.category : "vue";

          const validGenders = ["homme", "femme", "mixte", "enfant"];
          const gender = validGenders.includes(first.gender) ? first.gender : "mixte";

          // Creer le produit
          const { data: product, error: prodError } = (await supabase
            .from("products")
            .insert({
              name: first.name,
              slug: slugify(first.name) + "-" + Date.now().toString(36),
              description: first.description || null,
              category,
              gender,
              brand_id: brandId,
              base_price: parseFloat(first.price) || 0,
              is_active: true,
              requires_prescription: category === "vue",
              frame_shape: first.frame_shape || null,
              frame_material: first.frame_material || null,
              frame_color: first.frame_color || null,
            } as never)
            .select("id")
            .single()) as { data: { id: string } | null; error: { message: string } | null };

          if (prodError || !product) {
            errors.push(`${first.name}: ${prodError?.message || "Erreur creation"}`);
            continue;
          }

          // Creer les variantes
          const variants = groupRows.map((row) => ({
            product_id: product.id,
            color_name: row.color_name || "Defaut",
            color_hex: row.color_hex || "#000000",
            size: row.size || null,
            stock_quantity: parseInt(row.stock) || 0,
            is_active: true,
          }));

          await supabase.from("product_variants").insert(variants as never);
          success++;
        } catch (err) {
          errors.push(`${first.name}: Erreur inattendue`);
        }
      }

      setResult({
        total: productGroups.size,
        success,
        errors,
      });
      setImporting(false);
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Import CSV</h1>

      {/* Template */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Format du fichier CSV</h2>
        <p className="text-sm text-stone-500 mb-4">
          Le fichier doit utiliser le separateur <strong>point-virgule (;)</strong>. Voici les colonnes attendues :
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs text-stone-600 border border-stone-200 rounded-lg">
            <thead>
              <tr className="bg-stone-50">
                {["nom", "categorie", "marque", "prix", "genre", "forme", "materiau", "couleur_monture", "couleur", "hex", "taille", "stock", "description"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {["Ray-Ban Aviator", "soleil", "Ray-Ban", "159.00", "mixte", "Aviateur", "Metal", "Dore", "Or", "#FFD700", "M", "10", "Modele iconique"].map((v, i) => (
                  <td key={i} className="px-3 py-2 border-t border-stone-100">{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-400 mt-3">
          Categories valides : vue, soleil, ski, sport, enfant. Genres : homme, femme, mixte, enfant.
          <br />
          Plusieurs lignes avec le meme nom seront regroupees comme variantes du meme produit.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-8 cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors">
          <FileSpreadsheet size={40} className="text-stone-400 mb-2" />
          <span className="text-sm font-medium text-stone-700">
            {file ? file.name : "Cliquez pour choisir un fichier CSV"}
          </span>
          <span className="text-xs text-stone-400 mt-1">Fichier .csv avec separateur point-virgule</span>
          <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
        </label>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-3">
            Apercu ({preview.length} premieres lignes)
          </h3>
          <div className="overflow-x-auto">
            <table className="text-xs text-stone-600 w-full">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">Categorie</th>
                  <th className="px-3 py-2 text-left">Marque</th>
                  <th className="px-3 py-2 text-right">Prix</th>
                  <th className="px-3 py-2 text-left">Couleur</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.brand}</td>
                    <td className="px-3 py-2 text-right">{row.price} EUR</td>
                    <td className="px-3 py-2">{row.color_name}</td>
                    <td className="px-3 py-2 text-right">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 mt-4"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload size={18} />
                Lancer l&#39;import
              </>
            )}
          </button>
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            {result.errors.length === 0 ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <AlertCircle className="text-amber-600" size={24} />
            )}
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Import termine</h3>
              <p className="text-sm text-stone-500">
                {result.success} produit{result.success > 1 ? "s" : ""} importe{result.success > 1 ? "s" : ""} sur {result.total}
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">Erreurs ({result.errors.length})</h4>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

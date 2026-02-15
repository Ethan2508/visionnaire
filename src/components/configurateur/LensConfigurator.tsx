"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import type { EyeCorrection, PrescriptionData } from "@/lib/store/cart";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  Layers,
  Shield,
  Upload,
  FileText,
  ShoppingBag,
  X,
  AlertCircle,
  Phone,
  Pen,
  Ban,
  Info,
} from "lucide-react";

/* ─── Types ─── */

interface Variant {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string | null;
  price_override: number | null;
  stock_quantity: number;
  is_active: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  requires_prescription: boolean;
  brands: { name: string; slug: string } | null;
  product_variants: Variant[];
  product_images: ProductImage[];
}

interface LensOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

type CorrectionMethod = "none" | "manual" | "upload";
type VisionType = "unifocal" | "progressif";

/* ─── Steps definition ─── */

const STEP_KEYS = [
  "variante",
  "correction",
  "type",
  "options",
  "recapitulatif",
] as const;

const STEP_META: Record<
  string,
  { label: string; subtitle: string; icon: typeof Eye }
> = {
  variante: {
    label: "Monture",
    subtitle: "Choisissez votre monture",
    icon: Eye,
  },
  correction: {
    label: "Ma correction",
    subtitle: "Adaptez vos verres à votre vue",
    icon: FileText,
  },
  type: {
    label: "Type de verres",
    subtitle: "Sélectionnez la qualité de vos verres",
    icon: Layers,
  },
  options: {
    label: "Options",
    subtitle: "Personnalisez vos verres",
    icon: Shield,
  },
  recapitulatif: {
    label: "Récapitulatif",
    subtitle: "Vérifiez votre configuration",
    icon: ShoppingBag,
  },
};

/* ─── Optical field helpers ─── */

const SPH_VALUES: string[] = [];
for (let i = -20; i <= 20; i += 0.25) {
  SPH_VALUES.push(i > 0 ? `+${i.toFixed(2)}` : i.toFixed(2));
}

const CYL_VALUES: string[] = [];
for (let i = -6; i <= 0; i += 0.25) {
  CYL_VALUES.push(i.toFixed(2));
}

const AXE_VALUES: string[] = [];
for (let i = 0; i <= 180; i += 5) {
  AXE_VALUES.push(`${i}°`);
}

const ADD_VALUES: string[] = [];
for (let i = 0.75; i <= 3.5; i += 0.25) {
  ADD_VALUES.push(`+${i.toFixed(2)}`);
}

const PD_VALUES: string[] = [];
for (let i = 50; i <= 78; i += 0.5) {
  PD_VALUES.push(i.toFixed(1));
}

const EMPTY_EYE: EyeCorrection = { sph: "", cyl: "", axe: "", add: "" };

/* ─── Main component ─── */

export default function LensConfigurator({ product }: { product: Product }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [lensOptions, setLensOptions] = useState<LensOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Correction
  const [correctionMethod, setCorrectionMethod] =
    useState<CorrectionMethod | null>(null);
  const [visionType, setVisionType] = useState<VisionType | null>(null);
  const [od, setOd] = useState<EyeCorrection>({ ...EMPTY_EYE });
  const [og, setOg] = useState<EyeCorrection>({ ...EMPTY_EYE });
  const [pupillaryDistance, setPupillaryDistance] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState("");

  // Lens options
  const [selectedType, setSelectedType] = useState<LensOption | null>(null);
  const [selectedTraitements, setSelectedTraitements] = useState<LensOption[]>(
    []
  );
  const [selectedAmincissement, setSelectedAmincissement] =
    useState<LensOption | null>(null);

  // Cart
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  /* ─── Data loading ─── */

  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient();
      const { data } = (await supabase
        .from("lens_options")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("name")) as { data: LensOption[] | null };
      setLensOptions(data || []);
      setLoading(false);
    }
    loadOptions();
  }, []);

  useEffect(() => {
    const activeVariants = product.product_variants.filter((v) => v.is_active);
    if (activeVariants.length === 1) {
      setSelectedVariant(activeVariants[0]);
    }
  }, [product]);

  /* ─── Derived data ─── */

  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const typeOptions = lensOptions.filter((o) => o.category === "type");
  const traitementOptions = lensOptions.filter(
    (o) => o.category === "traitement"
  );
  const amincissementOptions = lensOptions.filter(
    (o) => o.category === "amincissement"
  );

  // Skip variant step if only one
  const steps = useMemo(() => {
    const keys =
      activeVariants.length <= 1
        ? STEP_KEYS.filter((k) => k !== "variante")
        : [...STEP_KEYS];
    return keys;
  }, [activeVariants.length]);

  const currentKey = steps[currentStep];
  const totalSteps = steps.length;

  // Pricing
  const framePrice = selectedVariant?.price_override ?? product.base_price;
  const typePrice = selectedType?.price ?? 0;
  const traitementsPrice = selectedTraitements.reduce(
    (sum, t) => sum + t.price,
    0
  );
  const amincissementPrice = selectedAmincissement?.price ?? 0;
  const totalLensPrice = typePrice + traitementsPrice + amincissementPrice;
  const totalPrice = framePrice + totalLensPrice;

  const primaryImage =
    product.product_images.find((img) => img.is_primary)?.url ||
    product.product_images[0]?.url;

  /* ─── Step validation ─── */

  function canProceed(): boolean {
    switch (currentKey) {
      case "variante":
        return !!selectedVariant;
      case "correction":
        if (!correctionMethod) return false;
        if (correctionMethod === "none") return true;
        if (correctionMethod === "upload")
          return !!prescriptionFile && !!visionType;
        if (correctionMethod === "manual") {
          if (!visionType) return false;
          if (!od.sph || !og.sph) return false;
          if (!pupillaryDistance) return false;
          return true;
        }
        return false;
      case "type":
        return correctionMethod === "none" || !!selectedType;
      case "options":
        return true;
      case "recapitulatif":
        return true;
      default:
        return true;
    }
  }

  /* ─── Handlers ─── */

  function toggleTraitement(option: LensOption) {
    setSelectedTraitements((prev) => {
      const exists = prev.find((t) => t.id === option.id);
      if (exists) return prev.filter((t) => t.id !== option.id);
      return [...prev, option];
    });
  }

  function handlePrescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      alert("Format accepté : JPG, PNG, WebP ou PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier ne doit pas dépasser 10 Mo");
      return;
    }
    setPrescriptionFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPrescriptionPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview("");
    }
  }

  function handleSelectCorrectionMethod(method: CorrectionMethod) {
    setCorrectionMethod(method);
    if (method === "none") {
      setVisionType(null);
      setOd({ ...EMPTY_EYE });
      setOg({ ...EMPTY_EYE });
      setPupillaryDistance("");
      setPrescriptionFile(null);
      setPrescriptionPreview("");
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    if (correctionMethod !== "none" && !selectedType) return;

    setUploadingPrescription(true);

    try {
      let prescriptionUrl: string | null = null;

      if (prescriptionFile) {
        const supabase = createClient();
        const ext = prescriptionFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("prescriptions")
            .upload(fileName, prescriptionFile);

        if (uploadError) {
          alert(
            "Erreur lors de l'upload de l'ordonnance : " + uploadError.message
          );
          setUploadingPrescription(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("prescriptions")
          .getPublicUrl(uploadData.path);
        prescriptionUrl = urlData.publicUrl;
      }

      const allSelectedOptions = [
        ...(selectedType ? [selectedType] : []),
        ...selectedTraitements,
        ...(selectedAmincissement ? [selectedAmincissement] : []),
      ];

      const primaryImg = product.product_images.find((img) => img.is_primary);

      const prescriptionData: PrescriptionData = {
        method: correctionMethod || "none",
        visionType: visionType,
        od: correctionMethod === "manual" ? od : null,
        og: correctionMethod === "manual" ? og : null,
        pupillaryDistance:
          correctionMethod === "manual" ? pupillaryDistance : "",
      };

      useCartStore.getState().addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        brandName: product.brands?.name || null,
        colorName: selectedVariant.color_name,
        size: selectedVariant.size,
        imageUrl: primaryImg?.url || product.product_images[0]?.url || null,
        price: selectedVariant.price_override ?? product.base_price,
        quantity: 1,
        requiresPrescription: correctionMethod !== "none",
        category: "vue",
        lensType: selectedType?.slug || null,
        lensOptions: allSelectedOptions.map((opt) => ({
          id: opt.id,
          name: opt.name,
          price: opt.price,
        })),
        prescriptionUrl,
        prescriptionData,
      });

      setAddedToCart(true);
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setUploadingPrescription(false);
    }
  }

  /* ─── Loading state ─── */

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-5xl mx-auto py-12">
        <div className="h-2 bg-stone-100 rounded w-full" />
        <div className="h-6 bg-stone-100 rounded w-48" />
        <div className="h-[400px] bg-stone-100 rounded" />
      </div>
    );
  }

  /* ─── Added to cart ─── */

  if (addedToCart) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-light text-stone-900 mb-2">
          Ajouté au <span className="font-semibold">panier</span>
        </h2>
        <p className="text-sm text-stone-500 mb-8 font-light">
          {product.brands?.name} {product.name} avec vos verres personnalisés
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/catalogue"
            className="px-6 py-3 border border-stone-300 text-stone-700 text-sm font-medium uppercase tracking-wider hover:bg-stone-50 transition-colors"
          >
            Continuer mes achats
          </Link>
          <Link
            href="/panier"
            className="px-6 py-3 bg-black text-white text-sm font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors"
          >
            Voir le panier
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-6">
        <Link href="/catalogue" className="hover:text-stone-900 transition-colors">
          Catalogue
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/catalogue/${product.slug}`}
          className="hover:text-stone-900 transition-colors"
        >
          {product.name}
        </Link>
        <ChevronRight size={12} />
        <span className="text-stone-700">Verres adaptés à la vue</span>
      </nav>

      {/* Banner */}
      <div className="bg-stone-50 border border-stone-100 rounded-lg p-5 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg border border-stone-100 shrink-0 mt-0.5">
            <Eye size={18} className="text-stone-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              Verres adaptés à la vue
            </h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xl font-light">
              Visionnaire Opticiens vous propose une gamme complète d&apos;options
              pour personnaliser vos verres. Choisissez de les adapter à votre
              vue, sélectionnez les traitements et la finition, pour des
              lunettes qui vous ressemblent.
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            Étape {currentStep + 1}/{totalSteps}
          </span>
          <span className="text-[11px] text-stone-400">
            {STEP_META[currentKey].label}
          </span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1">
          <div
            className="bg-black h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* ═══ Step: Variante ═══ */}
          {currentKey === "variante" && (
            <StepPanel
              title="Choisissez votre monture"
              description="Sélectionnez la couleur et la taille de votre monture."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-black bg-stone-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-stone-200 shrink-0"
                      style={{ backgroundColor: v.color_hex || "#ccc" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-stone-900 block">
                        {v.color_name}
                      </span>
                      {v.size && (
                        <span className="text-xs text-stone-500">
                          Taille {v.size}
                        </span>
                      )}
                    </div>
                    {v.price_override &&
                      v.price_override !== product.base_price && (
                        <span className="text-sm font-medium text-stone-700">
                          {formatPrice(v.price_override)}
                        </span>
                      )}
                    {selectedVariant?.id === v.id && (
                      <Check size={18} className="text-black shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </StepPanel>
          )}

          {/* ═══ Step: Correction ═══ */}
          {currentKey === "correction" && (
            <StepPanel
              title="Mes corrections"
              description="Sélectionnez l'option qui correspond à votre besoin."
            >
              <div className="space-y-6">
                {/* Method selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CorrectionMethodCard
                    icon={Ban}
                    title="Sans correction"
                    description="Verres non correcteurs"
                    selected={correctionMethod === "none"}
                    onClick={() => handleSelectCorrectionMethod("none")}
                  />
                  <CorrectionMethodCard
                    icon={Pen}
                    title="Saisie manuelle"
                    description="J'indique mes corrections"
                    selected={correctionMethod === "manual"}
                    onClick={() => handleSelectCorrectionMethod("manual")}
                  />
                  <CorrectionMethodCard
                    icon={Upload}
                    title="Mon ordonnance"
                    description="Je télécharge un fichier"
                    selected={correctionMethod === "upload"}
                    onClick={() => handleSelectCorrectionMethod("upload")}
                  />
                </div>

                {/* ─ Manual correction flow ─ */}
                {correctionMethod === "manual" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Vision type */}
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
                        Type de vision
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setVisionType("unifocal")}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            visionType === "unifocal"
                              ? "border-black bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <span className="text-sm font-semibold text-stone-900 block">
                            Vision de près OU de loin
                          </span>
                          <span className="text-xs text-stone-500 mt-1 block">
                            Verres unifocaux (simple foyer)
                          </span>
                          {visionType === "unifocal" && (
                            <Check
                              size={16}
                              className="text-black mt-2"
                            />
                          )}
                        </button>
                        <button
                          onClick={() => setVisionType("progressif")}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            visionType === "progressif"
                              ? "border-black bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <span className="text-sm font-semibold text-stone-900 block">
                            Vision de près ET de loin
                          </span>
                          <span className="text-xs text-stone-500 mt-1 block">
                            Verres progressifs (multi-foyer)
                          </span>
                          {visionType === "progressif" && (
                            <Check
                              size={16}
                              className="text-black mt-2"
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Correction fields */}
                    {visionType && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        {/* OD */}
                        <EyeRow
                          label="Œil droit (OD)"
                          eye={od}
                          onChange={setOd}
                          showAdd={visionType === "progressif"}
                        />

                        {/* OG */}
                        <EyeRow
                          label="Œil gauche (OG)"
                          eye={og}
                          onChange={setOg}
                          showAdd={visionType === "progressif"}
                        />

                        {/* Écart pupillaire */}
                        <div>
                          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                            Écart pupillaire (EP)
                          </label>
                          <div className="flex items-center gap-3">
                            <select
                              value={pupillaryDistance}
                              onChange={(e) =>
                                setPupillaryDistance(e.target.value)
                              }
                              className="w-32 px-3 py-2.5 border border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:border-black transition-colors"
                            >
                              <option value="">—</option>
                              {PD_VALUES.map((v) => (
                                <option key={v} value={v}>
                                  {v} mm
                                </option>
                              ))}
                            </select>
                            <span className="text-xs text-stone-400">
                              Indiqué sur votre ordonnance (54–78 mm)
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                          <Info
                            size={16}
                            className="text-blue-500 mt-0.5 shrink-0"
                          />
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Reportez les valeurs exactes de votre ordonnance.
                            Nos opticiens diplômés vérifieront vos données
                            avant la fabrication de vos verres.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Upload flow ─ */}
                {correctionMethod === "upload" && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Vision type */}
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
                        Type de vision
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setVisionType("unifocal")}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            visionType === "unifocal"
                              ? "border-black bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <span className="text-sm font-semibold text-stone-900 block">
                            Vision de près OU de loin
                          </span>
                          <span className="text-xs text-stone-500 mt-1 block">
                            Verres unifocaux
                          </span>
                        </button>
                        <button
                          onClick={() => setVisionType("progressif")}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            visionType === "progressif"
                              ? "border-black bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <span className="text-sm font-semibold text-stone-900 block">
                            Vision de près ET de loin
                          </span>
                          <span className="text-xs text-stone-500 mt-1 block">
                            Verres progressifs
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Upload zone */}
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
                        Votre ordonnance
                      </label>

                      {prescriptionFile ? (
                        <div className="border-2 border-stone-200 rounded-lg p-5">
                          <div className="flex items-center gap-4">
                            {prescriptionPreview ? (
                              <img
                                src={prescriptionPreview}
                                alt="Ordonnance"
                                className="w-20 h-20 object-cover rounded-lg border border-stone-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center">
                                <FileText
                                  size={28}
                                  className="text-stone-400"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-900 truncate">
                                {prescriptionFile.name}
                              </p>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {(
                                  prescriptionFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                Mo
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setPrescriptionFile(null);
                                setPrescriptionPreview("");
                              }}
                              className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-3 border-2 border-dashed border-stone-300 rounded-lg p-8 cursor-pointer hover:border-stone-500 hover:bg-stone-50 transition-colors">
                          <Upload size={28} className="text-stone-400" />
                          <div className="text-center">
                            <span className="text-sm font-medium text-stone-700 block">
                              Télécharger votre ordonnance
                            </span>
                            <span className="text-xs text-stone-400 mt-1 block">
                              PDF, PNG, JPG — Max 10 Mo
                            </span>
                          </div>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={handlePrescriptionChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* ─ No correction info ─ */}
                {correctionMethod === "none" && (
                  <div className="bg-stone-50 border border-stone-100 rounded-lg p-4 flex items-start gap-3 animate-in fade-in duration-300">
                    <Info
                      size={16}
                      className="text-stone-400 mt-0.5 shrink-0"
                    />
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Vos lunettes seront équipées de verres sans correction.
                      Vous pourrez toujours faire adapter vos verres en
                      boutique ultérieurement.
                    </p>
                  </div>
                )}

                {/* Contact banner */}
                {correctionMethod && correctionMethod !== "none" && (
                  <div className="bg-stone-950 text-white rounded-lg p-5 flex items-center gap-4">
                    <Phone size={18} className="text-white/40 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">
                        Un doute ou une correction particulière ?
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Contactez notre opticien pour un accompagnement
                        personnalisé.
                      </p>
                    </div>
                    <a
                      href="tel:+33478526222"
                      className="text-xs font-medium bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition-colors shrink-0"
                    >
                      04 78 52 62 22
                    </a>
                  </div>
                )}
              </div>
            </StepPanel>
          )}

          {/* ═══ Step: Type de verres ═══ */}
          {currentKey === "type" && (
            <StepPanel
              title="Sélectionnez le type de verres"
              description={
                correctionMethod === "none"
                  ? "Cette étape est optionnelle pour les verres sans correction."
                  : "Vos verres sont fabriqués en France et issus d'un savoir-faire d'excellence."
              }
            >
              {correctionMethod === "none" ? (
                <div className="bg-stone-50 border border-stone-100 rounded-lg p-4">
                  <p className="text-sm text-stone-600">
                    Pas de sélection nécessaire pour les verres sans correction.
                    Vous pouvez passer à l&apos;étape suivante.
                  </p>
                </div>
              ) : typeOptions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle
                    size={18}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <p className="text-sm text-amber-800">
                    Aucun type de verre n&apos;est configuré. Contactez-nous
                    pour un devis personnalisé.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typeOptions.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={selectedType?.id === option.id}
                      onClick={() => setSelectedType(option)}
                    />
                  ))}
                </div>
              )}
            </StepPanel>
          )}

          {/* ═══ Step: Options (traitements + amincissement) ═══ */}
          {currentKey === "options" && (
            <StepPanel
              title="Personnalisez vos verres"
              description="Ajoutez des traitements et choisissez l'épaisseur de vos verres."
            >
              <div className="space-y-8">
                {/* Traitements */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                    Traitements{" "}
                    <span className="text-stone-400 font-normal">
                      (optionnel)
                    </span>
                  </h3>
                  {traitementOptions.length === 0 ? (
                    <p className="text-sm text-stone-400">
                      Aucun traitement disponible.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {traitementOptions.map((option) => {
                        const isSelected = selectedTraitements.some(
                          (t) => t.id === option.id
                        );
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleTraitement(option)}
                            className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? "border-black bg-stone-50"
                                : "border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-black border-black"
                                  : "border-stone-300"
                              }`}
                            >
                              {isSelected && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-stone-900 block">
                                {option.name}
                              </span>
                              {option.description && (
                                <span className="text-xs text-stone-500 mt-0.5 block">
                                  {option.description}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-stone-700 shrink-0">
                              {option.price > 0
                                ? `+ ${formatPrice(option.price)}`
                                : "Inclus"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Amincissement */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                    Amincissement{" "}
                    <span className="text-stone-400 font-normal">
                      (optionnel)
                    </span>
                  </h3>
                  {amincissementOptions.length === 0 ? (
                    <p className="text-sm text-stone-400">
                      Aucune option d&apos;amincissement disponible.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Standard option */}
                      <button
                        onClick={() => setSelectedAmincissement(null)}
                        className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-all ${
                          !selectedAmincissement
                            ? "border-black bg-stone-50"
                            : "border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-stone-900 block">
                            Standard
                          </span>
                          <span className="text-xs text-stone-500 mt-0.5 block">
                            Épaisseur standard, adaptée aux corrections légères
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-stone-700 shrink-0">
                          Inclus
                        </span>
                        {!selectedAmincissement && (
                          <Check
                            size={16}
                            className="text-black shrink-0"
                          />
                        )}
                      </button>
                      {amincissementOptions.map((option) => (
                        <OptionCard
                          key={option.id}
                          option={option}
                          selected={selectedAmincissement?.id === option.id}
                          onClick={() => setSelectedAmincissement(option)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </StepPanel>
          )}

          {/* ═══ Step: Récapitulatif ═══ */}
          {currentKey === "recapitulatif" && (
            <StepPanel
              title="Récapitulatif de votre commande"
              description="Vérifiez votre configuration avant d'ajouter au panier."
            >
              <div className="space-y-4">
                {/* Monture */}
                <RecapRow
                  label="Monture"
                  imageSrc={primaryImage}
                  imageAlt={product.name}
                >
                  <div className="flex-1 min-w-0">
                    {product.brands && (
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        {product.brands.name}
                      </span>
                    )}
                    <p className="text-sm font-medium text-stone-900">
                      {product.name}
                    </p>
                    {selectedVariant && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="w-3 h-3 rounded-full border border-stone-200"
                          style={{
                            backgroundColor:
                              selectedVariant.color_hex || "#ccc",
                          }}
                        />
                        <span className="text-xs text-stone-500">
                          {selectedVariant.color_name}
                          {selectedVariant.size &&
                            ` — Taille ${selectedVariant.size}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-stone-900 shrink-0">
                    {formatPrice(framePrice)}
                  </span>
                </RecapRow>

                {/* Correction */}
                <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
                  <div className="px-4 py-3 bg-stone-50">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Correction
                    </span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500">Méthode</span>
                      <p className="text-sm font-medium text-stone-900">
                        {correctionMethod === "none"
                          ? "Sans correction"
                          : correctionMethod === "manual"
                          ? "Saisie manuelle"
                          : "Ordonnance téléchargée"}
                      </p>
                    </div>
                    {visionType && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                        {visionType === "unifocal"
                          ? "Unifocal"
                          : "Progressif"}
                      </span>
                    )}
                  </div>

                  {correctionMethod === "manual" && (
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                            Œil droit
                          </span>
                          <p className="text-stone-700 mt-1">
                            SPH {od.sph} / CYL {od.cyl || "—"} / AXE{" "}
                            {od.axe || "—"}
                            {visionType === "progressif" &&
                              ` / ADD ${od.add || "—"}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                            Œil gauche
                          </span>
                          <p className="text-stone-700 mt-1">
                            SPH {og.sph} / CYL {og.cyl || "—"} / AXE{" "}
                            {og.axe || "—"}
                            {visionType === "progressif" &&
                              ` / ADD ${og.add || "—"}`}
                          </p>
                        </div>
                      </div>
                      {pupillaryDistance && (
                        <p className="text-xs text-stone-500 mt-2">
                          EP : {pupillaryDistance} mm
                        </p>
                      )}
                    </div>
                  )}

                  {prescriptionFile && (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <Check
                        size={14}
                        className="text-green-600 shrink-0"
                      />
                      <span className="text-xs text-green-700">
                        Ordonnance jointe : {prescriptionFile.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Verres */}
                {correctionMethod !== "none" && (
                  <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
                    <div className="px-4 py-3 bg-stone-50">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        Configuration des verres
                      </span>
                    </div>

                    {selectedType && (
                      <RecapLine
                        label="Type"
                        value={selectedType.name}
                        price={selectedType.price}
                      />
                    )}

                    {selectedTraitements.map((t) => (
                      <RecapLine
                        key={t.id}
                        label="Traitement"
                        value={t.name}
                        price={t.price}
                      />
                    ))}

                    <RecapLine
                      label="Amincissement"
                      value={selectedAmincissement?.name || "Standard"}
                      price={selectedAmincissement?.price ?? 0}
                    />
                  </div>
                )}
              </div>
            </StepPanel>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Retour
            </button>

            {currentKey === "recapitulatif" ? (
              <button
                onClick={handleAddToCart}
                disabled={
                  uploadingPrescription ||
                  !selectedVariant ||
                  (correctionMethod !== "none" && !selectedType)
                }
                className="inline-flex items-center gap-2.5 bg-black text-white px-8 py-3.5 text-sm font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPrescription ? (
                  "Ajout en cours…"
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Ajouter au panier — {formatPrice(totalPrice)}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
                }
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-sm font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-28 space-y-5">
            {/* Product card */}
            <div className="bg-stone-50 rounded-lg overflow-hidden">
              {primaryImage && (
                <div className="relative aspect-square">
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                {product.brands && (
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    {product.brands.name}
                  </span>
                )}
                <p className="text-sm font-semibold text-stone-900">
                  {product.name}
                </p>
                {selectedVariant && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedVariant.color_name}
                    {selectedVariant.size &&
                      ` — ${selectedVariant.size}`}
                  </p>
                )}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Monture</span>
                <span className="font-medium text-stone-900">
                  {formatPrice(framePrice)}
                </span>
              </div>

              {selectedType && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{selectedType.name}</span>
                  <span className="font-medium text-stone-900">
                    {selectedType.price > 0
                      ? formatPrice(selectedType.price)
                      : "—"}
                  </span>
                </div>
              )}

              {selectedTraitements.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-stone-500">{t.name}</span>
                  <span className="font-medium text-stone-900">
                    {t.price > 0 ? formatPrice(t.price) : "—"}
                  </span>
                </div>
              ))}

              {selectedAmincissement && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">
                    {selectedAmincissement.name}
                  </span>
                  <span className="font-medium text-stone-900">
                    {formatPrice(selectedAmincissement.price)}
                  </span>
                </div>
              )}

              <div className="border-t border-stone-100 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-stone-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-stone-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                {totalPrice >= 150 && (
                  <p className="text-xs text-green-600 mt-1">
                    Livraison offerte
                  </p>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="text-center space-y-1">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Besoin d&apos;aide ?
              </p>
              <p className="text-xs text-stone-500">
                Nos opticiens sont disponibles pour vous guider.
              </p>
              <a
                href="tel:+33478526222"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-black transition-colors mt-1"
              >
                <Phone size={12} />
                04 78 52 62 22
              </a>
              <p className="text-[10px] text-stone-400">
                Du lundi au samedi de 9h à 18h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky total */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider">
              Total
            </span>
            <p className="text-lg font-bold text-stone-900">
              {formatPrice(totalPrice)}
            </p>
          </div>
          {currentKey === "recapitulatif" ? (
            <button
              onClick={handleAddToCart}
              disabled={
                uploadingPrescription ||
                !selectedVariant ||
                (correctionMethod !== "none" && !selectedType)
              }
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <ShoppingBag size={16} />
              Ajouter
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
              }
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium uppercase tracking-wider disabled:opacity-50"
            >
              Suivant <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
    Sub-components
═══════════════════════════════════════════ */

function StepPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-light text-stone-900">
        {title.split(" ").slice(0, -1).join(" ")}{" "}
        <span className="font-semibold">{title.split(" ").slice(-1)}</span>
      </h2>
      <p className="text-sm text-stone-400 mt-1 mb-6 font-light">
        {description}
      </p>
      {children}
    </div>
  );
}

function CorrectionMethodCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-5 border-2 rounded-lg text-center transition-all ${
        selected
          ? "border-black bg-stone-50"
          : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <div
        className={`p-2.5 rounded-lg transition-colors ${
          selected ? "bg-black" : "bg-stone-100"
        }`}
      >
        <Icon
          size={18}
          className={selected ? "text-white" : "text-stone-600"}
        />
      </div>
      <span className="text-sm font-semibold text-stone-900">{title}</span>
      <span className="text-[11px] text-stone-500 leading-snug">
        {description}
      </span>
      {selected && <Check size={16} className="text-black" />}
    </button>
  );
}

function EyeRow({
  label,
  eye,
  onChange,
  showAdd,
}: {
  label: string;
  eye: EyeCorrection;
  onChange: (val: EyeCorrection) => void;
  showAdd: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
        {label}
      </label>
      <div className={`grid gap-2 ${showAdd ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <OpticalSelect
          label="SPH"
          value={eye.sph}
          options={SPH_VALUES}
          onChange={(v) => onChange({ ...eye, sph: v })}
        />
        <OpticalSelect
          label="CYL"
          value={eye.cyl}
          options={CYL_VALUES}
          onChange={(v) => onChange({ ...eye, cyl: v })}
        />
        <OpticalSelect
          label="AXE"
          value={eye.axe}
          options={AXE_VALUES}
          onChange={(v) => onChange({ ...eye, axe: v })}
        />
        {showAdd && (
          <OpticalSelect
            label="ADD"
            value={eye.add}
            options={ADD_VALUES}
            onChange={(v) => onChange({ ...eye, add: v })}
          />
        )}
      </div>
    </div>
  );
}

function OpticalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-[10px] text-stone-400 font-medium block mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:border-black transition-colors"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: LensOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-all ${
        selected
          ? "border-black bg-stone-50"
          : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-stone-900 block">
          {option.name}
        </span>
        {option.description && (
          <span className="text-xs text-stone-500 mt-0.5 block">
            {option.description}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-stone-700 shrink-0">
        {option.price > 0 ? `+ ${formatPrice(option.price)}` : "Inclus"}
      </span>
      {selected && <Check size={16} className="text-black shrink-0" />}
    </button>
  );
}

function RecapRow({
  label,
  imageSrc,
  imageAlt,
  children,
}: {
  label: string;
  imageSrc?: string;
  imageAlt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4 p-4">
        {imageSrc && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <Image
              src={imageSrc}
              alt={imageAlt || ""}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function RecapLine({
  label,
  value,
  price,
}: {
  label: string;
  value: string;
  price: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <span className="text-xs text-stone-400">{label}</span>
        <p className="text-sm font-medium text-stone-900">{value}</p>
      </div>
      <span className="text-sm text-stone-700">
        {price > 0 ? `+ ${formatPrice(price)}` : "Inclus"}
      </span>
    </div>
  );
}

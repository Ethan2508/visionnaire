"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
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
} from "lucide-react";

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

const STEPS = [
  { key: "variante", label: "Monture", icon: Eye },
  { key: "type", label: "Type de verre", icon: Layers },
  { key: "traitement", label: "Traitements", icon: Shield },
  { key: "amincissement", label: "Amincissement", icon: Layers },
  { key: "ordonnance", label: "Ordonnance", icon: FileText },
  { key: "recapitulatif", label: "Recapitulatif", icon: ShoppingBag },
];

export default function LensConfigurator({ product }: { product: Product }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [lensOptions, setLensOptions] = useState<LensOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration state
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedType, setSelectedType] = useState<LensOption | null>(null);
  const [selectedTraitements, setSelectedTraitements] = useState<LensOption[]>([]);
  const [selectedAmincissement, setSelectedAmincissement] = useState<LensOption | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string>("");
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

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

  const typeOptions = lensOptions.filter((o) => o.category === "type");
  const traitementOptions = lensOptions.filter((o) => o.category === "traitement");
  const amincissementOptions = lensOptions.filter((o) => o.category === "amincissement");
  const activeVariants = product.product_variants.filter((v) => v.is_active);

  // Skip variant step if only one variant
  const steps = activeVariants.length <= 1
    ? STEPS.filter((s) => s.key !== "variante")
    : STEPS;

  const framePrice = selectedVariant?.price_override ?? product.base_price;
  const typePrice = selectedType?.price ?? 0;
  const traitementsPrice = selectedTraitements.reduce((sum, t) => sum + t.price, 0);
  const amincissementPrice = selectedAmincissement?.price ?? 0;
  const totalLensPrice = typePrice + traitementsPrice + amincissementPrice;
  const totalPrice = framePrice + totalLensPrice;

  function canProceed(): boolean {
    const step = steps[currentStep];
    switch (step.key) {
      case "variante":
        return !!selectedVariant;
      case "type":
        return !!selectedType;
      case "traitement":
        return true; // optional
      case "amincissement":
        return true; // optional (will default to standard)
      case "ordonnance":
        return !!prescriptionFile;
      case "recapitulatif":
        return true;
      default:
        return true;
    }
  }

  function toggleTraitement(option: LensOption) {
    setSelectedTraitements((prev) => {
      const exists = prev.find((t) => t.id === option.id);
      if (exists) {
        return prev.filter((t) => t.id !== option.id);
      }
      return [...prev, option];
    });
  }

  function handlePrescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format accepte : JPG, PNG, WebP ou PDF");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier ne doit pas depasser 10 Mo");
      return;
    }

    setPrescriptionFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPrescriptionPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview("");
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant || !selectedType) return;

    setUploadingPrescription(true);

    try {
      let prescriptionUrl: string | null = null;

      // Upload prescription to Supabase Storage if provided
      if (prescriptionFile) {
        const supabase = createClient();
        const ext = prescriptionFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(fileName, prescriptionFile);

        if (uploadError) {
          alert("Erreur lors de l'upload de l'ordonnance : " + uploadError.message);
          setUploadingPrescription(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("prescriptions")
          .getPublicUrl(uploadData.path);
        prescriptionUrl = urlData.publicUrl;
      }

      // Build lens options list for the cart item
      const allSelectedOptions = [
        selectedType,
        ...selectedTraitements,
        ...(selectedAmincissement ? [selectedAmincissement] : []),
      ];

      const primaryImg = product.product_images.find((img) => img.is_primary);

      // Add to Zustand store
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
        requiresPrescription: true,
        category: "vue",
        lensType: selectedType.slug,
        lensOptions: allSelectedOptions.map((opt) => ({
          id: opt.id,
          name: opt.name,
          price: opt.price,
        })),
        prescriptionUrl,
      });

      setAddedToCart(true);
    } catch {
      alert("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setUploadingPrescription(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-stone-100 rounded w-48" />
        <div className="h-[400px] bg-stone-100 rounded" />
      </div>
    );
  }

  if (addedToCart) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">
          Ajoute au panier
        </h2>
        <p className="text-stone-500 mb-8">
          {product.brands?.name} {product.name} avec vos verres personnalises
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/catalogue"
            className="px-6 py-3 border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Continuer mes achats
          </Link>
          <Link
            href="/panier"
            className="px-6 py-3 bg-black text-white text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Voir le panier
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = product.product_images.find((img) => img.is_primary)?.url
    || product.product_images[0]?.url;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-stone-500 mb-8">
        <Link href="/catalogue" className="hover:text-stone-900">Catalogue</Link>
        <ChevronRight size={14} />
        <Link href={`/catalogue/${product.slug}`} className="hover:text-stone-900">
          {product.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-stone-900">Configuration des verres</span>
      </nav>

      {/* Step progress */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isDone = index < currentStep;

          return (
            <div key={step.key} className="flex items-center shrink-0">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : isDone
                    ? "bg-stone-100 text-stone-900 hover:bg-stone-200 cursor-pointer"
                    : "text-stone-400 cursor-default"
                }`}
              >
                {isDone ? (
                  <Check size={14} />
                ) : (
                  <StepIcon size={14} />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight size={14} className="text-stone-300 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step: Variante */}
          {steps[currentStep].key === "variante" && (
            <StepContainer
              title="Choisissez votre monture"
              description="Selectionnez la couleur de votre monture"
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
                    <div>
                      <span className="text-sm font-medium text-stone-900 block">
                        {v.color_name}
                      </span>
                      {v.size && (
                        <span className="text-xs text-stone-500">Taille {v.size}</span>
                      )}
                    </div>
                    {v.price_override && v.price_override !== product.base_price && (
                      <span className="ml-auto text-sm font-medium text-stone-700">
                        {formatPrice(v.price_override)}
                      </span>
                    )}
                    {selectedVariant?.id === v.id && (
                      <Check size={18} className="ml-auto text-black" />
                    )}
                  </button>
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step: Type de verre */}
          {steps[currentStep].key === "type" && (
            <StepContainer
              title="Type de verre"
              description="Choisissez le type de verre adapte a votre correction"
            >
              {typeOptions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    Aucun type de verre n'est configure. Contactez-nous pour un devis personnalise.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedType(option)}
                      className={`w-full flex items-center gap-4 p-5 border-2 rounded-lg text-left transition-all ${
                        selectedType?.id === option.id
                          ? "border-black bg-stone-50"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-stone-900 block">
                          {option.name}
                        </span>
                        {option.description && (
                          <span className="text-xs text-stone-500 mt-1 block">
                            {option.description}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-stone-700 shrink-0">
                        {option.price > 0 ? `+ ${formatPrice(option.price)}` : "Inclus"}
                      </span>
                      {selectedType?.id === option.id && (
                        <Check size={18} className="text-black shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </StepContainer>
          )}

          {/* Step: Traitements */}
          {steps[currentStep].key === "traitement" && (
            <StepContainer
              title="Traitements"
              description="Ajoutez des traitements a vos verres (optionnel)"
            >
              {traitementOptions.length === 0 ? (
                <p className="text-sm text-stone-500">Aucun traitement disponible.</p>
              ) : (
                <div className="space-y-3">
                  {traitementOptions.map((option) => {
                    const isSelected = selectedTraitements.some((t) => t.id === option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleTraitement(option)}
                        className={`w-full flex items-center gap-4 p-5 border-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? "border-black bg-stone-50"
                            : "border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-black border-black" : "border-stone-300"
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-stone-900 block">
                            {option.name}
                          </span>
                          {option.description && (
                            <span className="text-xs text-stone-500 mt-1 block">
                              {option.description}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-stone-700 shrink-0">
                          {option.price > 0 ? `+ ${formatPrice(option.price)}` : "Inclus"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </StepContainer>
          )}

          {/* Step: Amincissement */}
          {steps[currentStep].key === "amincissement" && (
            <StepContainer
              title="Amincissement des verres"
              description="Choisissez l'epaisseur de vos verres (optionnel)"
            >
              {amincissementOptions.length === 0 ? (
                <p className="text-sm text-stone-500">Aucune option d'amincissement disponible.</p>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedAmincissement(null)}
                    className={`w-full flex items-center gap-4 p-5 border-2 rounded-lg text-left transition-all ${
                      !selectedAmincissement
                        ? "border-black bg-stone-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-stone-900 block">
                        Standard
                      </span>
                      <span className="text-xs text-stone-500 mt-1 block">
                        Epaisseur standard, adaptee aux faibles corrections
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-stone-700 shrink-0">
                      Inclus
                    </span>
                    {!selectedAmincissement && (
                      <Check size={18} className="text-black shrink-0" />
                    )}
                  </button>
                  {amincissementOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedAmincissement(option)}
                      className={`w-full flex items-center gap-4 p-5 border-2 rounded-lg text-left transition-all ${
                        selectedAmincissement?.id === option.id
                          ? "border-black bg-stone-50"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-stone-900 block">
                          {option.name}
                        </span>
                        {option.description && (
                          <span className="text-xs text-stone-500 mt-1 block">
                            {option.description}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-stone-700 shrink-0">
                        + {formatPrice(option.price)}
                      </span>
                      {selectedAmincissement?.id === option.id && (
                        <Check size={18} className="text-black shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </StepContainer>
          )}

          {/* Step: Ordonnance */}
          {steps[currentStep].key === "ordonnance" && (
            <StepContainer
              title="Votre ordonnance"
              description="Telechargez votre ordonnance pour que votre opticien valide votre commande"
            >
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Votre ordonnance sera verifiee par notre opticien diplome avant la fabrication de vos verres.
                    Formats acceptes : JPG, PNG, WebP ou PDF (max 10 Mo).
                  </p>
                </div>

                {prescriptionFile ? (
                  <div className="border-2 border-stone-200 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      {prescriptionPreview ? (
                        <img
                          src={prescriptionPreview}
                          alt="Ordonnance"
                          className="w-24 h-24 object-cover rounded-lg border border-stone-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-stone-100 rounded-lg flex items-center justify-center">
                          <FileText size={32} className="text-stone-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900">
                          {prescriptionFile.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {(prescriptionFile.size / 1024 / 1024).toFixed(2)} Mo
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPrescriptionFile(null);
                          setPrescriptionPreview("");
                        }}
                        className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-4 border-2 border-dashed border-stone-300 rounded-lg p-10 cursor-pointer hover:border-stone-500 hover:bg-stone-50 transition-colors">
                    <Upload size={32} className="text-stone-400" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-stone-700 block">
                        Cliquez pour telecharger votre ordonnance
                      </span>
                      <span className="text-xs text-stone-500 mt-1 block">
                        JPG, PNG, WebP ou PDF — Max 10 Mo
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

                <p className="text-xs text-stone-400">
                  Vous n'avez pas d'ordonnance ? Vous pouvez{" "}
                  <Link href="/rendez-vous" className="text-black underline">
                    prendre rendez-vous
                  </Link>{" "}
                  pour un examen de vue.
                </p>
              </div>
            </StepContainer>
          )}

          {/* Step: Recapitulatif */}
          {steps[currentStep].key === "recapitulatif" && (
            <StepContainer
              title="Recapitulatif de votre commande"
              description="Verifiez votre configuration avant d'ajouter au panier"
            >
              <div className="space-y-4">
                {/* Monture */}
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                  {primaryImage && (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    {product.brands && (
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                        {product.brands.name}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-stone-900">{product.name}</p>
                    {selectedVariant && (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3 h-3 rounded-full border border-stone-200"
                          style={{ backgroundColor: selectedVariant.color_hex || "#ccc" }}
                        />
                        <span className="text-xs text-stone-500">{selectedVariant.color_name}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-stone-900">
                    {formatPrice(framePrice)}
                  </span>
                </div>

                {/* Verres */}
                <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
                  <div className="px-4 py-3 bg-stone-50 rounded-t-lg">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Configuration des verres
                    </span>
                  </div>

                  {selectedType && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-xs text-stone-500">Type</span>
                        <p className="text-sm font-medium text-stone-900">{selectedType.name}</p>
                      </div>
                      <span className="text-sm text-stone-700">
                        {selectedType.price > 0 ? `+ ${formatPrice(selectedType.price)}` : "Inclus"}
                      </span>
                    </div>
                  )}

                  {selectedTraitements.length > 0 && selectedTraitements.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-xs text-stone-500">Traitement</span>
                        <p className="text-sm font-medium text-stone-900">{t.name}</p>
                      </div>
                      <span className="text-sm text-stone-700">
                        {t.price > 0 ? `+ ${formatPrice(t.price)}` : "Inclus"}
                      </span>
                    </div>
                  ))}

                  {selectedAmincissement && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-xs text-stone-500">Amincissement</span>
                        <p className="text-sm font-medium text-stone-900">{selectedAmincissement.name}</p>
                      </div>
                      <span className="text-sm text-stone-700">
                        + {formatPrice(selectedAmincissement.price)}
                      </span>
                    </div>
                  )}

                  {!selectedAmincissement && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-xs text-stone-500">Amincissement</span>
                        <p className="text-sm font-medium text-stone-900">Standard</p>
                      </div>
                      <span className="text-sm text-stone-700">Inclus</span>
                    </div>
                  )}
                </div>

                {/* Ordonnance */}
                {prescriptionFile && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Check size={16} className="text-green-600 shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-green-800">Ordonnance jointe</span>
                      <span className="text-xs text-green-600 block">{prescriptionFile.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </StepContainer>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-600 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Retour
            </button>

            {steps[currentStep].key === "recapitulatif" ? (
              <button
                onClick={handleAddToCart}
                disabled={uploadingPrescription || !selectedVariant || !selectedType}
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPrescription ? (
                  "Ajout en cours..."
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Ajouter au panier — {formatPrice(totalPrice)}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Price summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-stone-50 rounded-lg p-6 space-y-4">
            {primaryImage && (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
            )}

            <div>
              {product.brands && (
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  {product.brands.name}
                </span>
              )}
              <p className="text-sm font-semibold text-stone-900">{product.name}</p>
              {selectedVariant && (
                <p className="text-xs text-stone-500 mt-0.5">{selectedVariant.color_name}</p>
              )}
            </div>

            <div className="border-t border-stone-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Monture</span>
                <span className="text-stone-900 font-medium">{formatPrice(framePrice)}</span>
              </div>

              {selectedType && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{selectedType.name}</span>
                  <span className="text-stone-900 font-medium">
                    {selectedType.price > 0 ? formatPrice(selectedType.price) : "—"}
                  </span>
                </div>
              )}

              {selectedTraitements.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-stone-500">{t.name}</span>
                  <span className="text-stone-900 font-medium">
                    {t.price > 0 ? formatPrice(t.price) : "—"}
                  </span>
                </div>
              ))}

              {selectedAmincissement && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{selectedAmincissement.name}</span>
                  <span className="text-stone-900 font-medium">
                    {formatPrice(selectedAmincissement.price)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 pt-4">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-stone-900">Total</span>
                <span className="text-lg font-bold text-stone-900">{formatPrice(totalPrice)}</span>
              </div>
              {totalPrice >= 150 && (
                <p className="text-xs text-green-600 mt-1">Livraison offerte</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContainer({
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
      <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
      <p className="text-sm text-stone-500 mt-1 mb-6">{description}</p>
      {children}
    </div>
  );
}

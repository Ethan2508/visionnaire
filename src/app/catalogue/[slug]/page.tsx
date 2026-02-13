"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice, categoryLabel } from "@/lib/utils";
import { ShoppingBag, ChevronRight, ChevronLeft, Check, Search } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

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
  variant_id: string | null;
  sort_order?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  gender: string;
  base_price: number;
  requires_prescription: boolean;
  frame_shape: string | null;
  frame_material: string | null;
  frame_color: string | null;
  brands: { name: string; slug: string } | null;
  product_variants: Variant[];
  product_images: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // Zoom state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("products")
      .select(
        "*, brands(name, slug), product_variants(*), product_images(*)"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single()) as { data: Product | null };

    if (data) {
      // Sort images: primary first, then by sort_order
      data.product_images.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      setProduct(data);
      const activeVariants = data.product_variants.filter((v) => v.is_active);
      if (activeVariants.length > 0) {
        setSelectedVariant(activeVariants[0]);
      }
      setCurrentImageIndex(0);
    }
    setLoading(false);
  }

  const images = product?.product_images ?? [];

  const prevImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-stone-100 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-stone-100 rounded w-24" />
            <div className="h-8 bg-stone-100 rounded w-3/4" />
            <div className="h-6 bg-stone-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Produit non trouve</h1>
        <Link href="/catalogue" className="text-stone-600 hover:text-stone-900 underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price_override ?? product.base_price;
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const currentImage = images[currentImageIndex];

  const specs = [
    { label: "Categorie", value: categoryLabel(product.category) },
    product.frame_shape && { label: "Forme", value: product.frame_shape },
    product.frame_material && { label: "Materiau", value: product.frame_material },
    product.frame_color && { label: "Couleur", value: product.frame_color },
    selectedVariant?.size && { label: "Taille", value: selectedVariant.size },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-stone-500 mb-6">
        <Link href="/catalogue" className="hover:text-stone-900">Catalogue</Link>
        <ChevronRight size={14} />
        <Link href={`/catalogue?categorie=${product.category}`} className="hover:text-stone-900">
          {categoryLabel(product.category)}
        </Link>
        {product.brands && (
          <>
            <ChevronRight size={14} />
            <Link href={`/marques/${product.brands.slug}`} className="hover:text-stone-900">
              {product.brands.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-stone-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images - Carrousel + Zoom */}
        <div>
          {/* Main image with zoom */}
          <div
            ref={mainImageRef}
            className="aspect-square bg-stone-100 rounded-xl overflow-hidden mb-3 relative group cursor-zoom-in"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            {currentImage ? (
              <>
                {/* Normal image */}
                <img
                  src={currentImage.url}
                  alt={currentImage.alt_text || product.name}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    isZooming ? "opacity-0" : "opacity-100"
                  }`}
                />
                {/* Zoomed image (shown on hover) */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${
                    isZooming ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                  style={{
                    backgroundImage: `url(${currentImage.url})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
                {/* Zoom indicator */}
                <div
                  className={`absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm transition-opacity ${
                    isZooming ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Search size={16} className="text-stone-600" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                Pas d&#39;image
              </div>
            )}

            {/* Carousel arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                  aria-label="Image precedente"
                >
                  <ChevronLeft size={18} className="text-stone-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                  aria-label="Image suivante"
                >
                  <ChevronRight size={18} className="text-stone-700" />
                </button>

                {/* Counter */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === i
                      ? "border-stone-900 ring-1 ring-stone-900"
                      : "border-stone-200 hover:border-stone-400"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          {product.brands && (
            <Link
              href={`/marques/${product.brands.slug}`}
              className="text-sm font-medium text-stone-500 uppercase tracking-wide hover:text-stone-900"
            >
              {product.brands.name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mt-1">
            {product.name}
          </h1>

          <p className="text-2xl font-bold text-stone-900 mt-4">
            {formatPrice(currentPrice)}
          </p>

          {product.requires_prescription && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              + prix des verres correcteurs selon vos besoins
            </p>
          )}

          {/* Selection variante */}
          {activeVariants.length > 1 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-2">
                Couleur : {selectedVariant?.color_name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2"
                        : "border-stone-300 hover:border-stone-500"
                    }`}
                    style={{ backgroundColor: v.color_hex || "#ccc" }}
                    title={v.color_name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {selectedVariant && (
            <p className={`text-sm mt-4 ${selectedVariant.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
              {selectedVariant.stock_quantity > 0
                ? `En stock (${selectedVariant.stock_quantity} disponible${selectedVariant.stock_quantity > 1 ? "s" : ""})`
                : "Rupture de stock"}
            </p>
          )}

          {/* Bouton panier */}
          {product.requires_prescription ? (
            <Link
              href={`/catalogue/${slug}/configurer`}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors mt-6 w-full justify-center"
            >
              Configurer mes verres
            </Link>
          ) : (
            <button
              onClick={() => {
                if (!selectedVariant || !product) return;
                const primaryImg = product.product_images.find((img) => img.is_primary);
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
                  requiresPrescription: false,
                  category: product.category,
                  lensType: null,
                  lensOptions: [],
                  prescriptionUrl: null,
                });
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2000);
              }}
              disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors mt-6 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addedToCart ? (
                <>
                  <Check size={18} />
                  Ajoute au panier !
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Ajouter au panier
                </>
              )}
            </button>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Description</h3>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Caracteristiques</h3>
              <dl className="grid grid-cols-2 gap-2">
                {specs.map((spec) => (
                  <div key={spec.label} className="bg-stone-50 rounded-lg px-3 py-2">
                    <dt className="text-xs text-stone-500">{spec.label}</dt>
                    <dd className="text-sm font-medium text-stone-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

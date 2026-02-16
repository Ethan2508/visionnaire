"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCardProps {
  slug: string;
  name: string;
  brandName?: string;
  price: number;
  compareAtPrice?: number;
  images?: { url: string; is_primary?: boolean }[];
  imageUrl?: string; // fallback si pas d'images[]
  category: string;
}

export default function ProductCard({
  slug,
  name,
  brandName,
  price,
  compareAtPrice,
  images,
  imageUrl,
  category,
}: ProductCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build image list: use images array if available, fallback to single imageUrl
  const imageList = images && images.length > 0
    ? images.map((img) => img.url)
    : imageUrl
      ? [imageUrl]
      : [];

  const hasMultiple = imageList.length > 1;

  const goTo = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex(index);
    },
    []
  );

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
    },
    [imageList.length]
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));
    },
    [imageList.length]
  );

  return (
    <Link
      href={`/catalogue/${slug}`}
      className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all"
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {imageList.length > 0 ? (
          <>
            {/* Images container */}
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {imageList.map((url, i) => (
                <div key={i} className="relative w-full h-full shrink-0">
                  <Image
                    src={url}
                    alt={`${name} - image ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>

            {/* Arrows (visible on hover only) */}
            {hasMultiple && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Image précédente"
                >
                  <ChevronLeft size={16} className="text-stone-700" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Image suivante"
                >
                  <ChevronRight size={16} className="text-stone-700" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {imageList.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => goTo(e, i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        currentIndex === i
                          ? "bg-white w-3"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                  {imageList.length > 5 && (
                    <span className="text-[8px] text-white/80 ml-0.5">
                      +{imageList.length - 5}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        {brandName && (
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">
            {brandName}
          </p>
        )}
        <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-700 line-clamp-2">
          {name}
        </h3>
        {compareAtPrice && compareAtPrice > price ? (
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-sm font-bold text-red-600">
              {formatPrice(price)}
            </p>
            <p className="text-xs text-stone-400 line-through">
              {formatPrice(compareAtPrice)}
            </p>
            <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
              -{Math.round((1 - price / compareAtPrice) * 100)}%
            </span>
          </div>
        ) : (
          <p className="text-sm font-bold text-stone-900 mt-2">
            {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  );
}

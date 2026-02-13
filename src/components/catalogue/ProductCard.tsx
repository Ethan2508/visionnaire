import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  slug: string;
  name: string;
  brandName?: string;
  price: number;
  imageUrl?: string;
  category: string;
  requiresPrescription: boolean;
}

export default function ProductCard({
  slug,
  name,
  brandName,
  price,
  imageUrl,
  category,
  requiresPrescription,
}: ProductCardProps) {
  return (
    <Link
      href={`/catalogue/${slug}`}
      className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all"
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {requiresPrescription && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Verres correcteurs
          </span>
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
        <p className="text-sm font-bold text-stone-900 mt-2">
          {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
}

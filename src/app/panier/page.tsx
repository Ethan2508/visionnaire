"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, type CartItem } from "@/lib/store/cart";
import { formatPrice, SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";

function CartItemRow({ item, onUpdateQuantity, onRemove }: {
  item: CartItem;
  onUpdateQuantity: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 py-6 border-b border-stone-100 last:border-b-0">
      {/* Image */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 relative">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <ShoppingBag size={32} />
          </div>
        )}
      </div>

      {/* Détails */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            {item.brandName && (
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">
                {item.brandName}
              </p>
            )}
            <Link
              href={`/catalogue/${item.productSlug}`}
              className="text-sm sm:text-base font-medium text-stone-900 hover:underline line-clamp-1"
            >
              {item.productName}
            </Link>
            <p className="text-xs text-stone-500 mt-0.5">
              {item.colorName}
              {item.size && ` — ${item.size}`}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.variantId)}
            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
            aria-label="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Quantité & prix */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-stone-200 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
              className="p-1.5 text-stone-500 hover:text-stone-900"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900">
              {formatPrice(itemTotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-stone-400">
                {formatPrice(item.price)} / pièce
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PanierPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-48" />
            <div className="h-64 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-stone-300 mb-4" />
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Votre panier est vide
          </h1>
          <p className="text-stone-500 mb-6">
            Découvrez nos collections et trouvez la paire parfaite.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Parcourir le catalogue
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();
  const shippingCost = total < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const finalTotal = total + shippingCost;

  return (
    <main className="min-h-screen bg-stone-50 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
          Mon panier
        </h1>
        <p className="text-stone-500 mb-8">
          {itemCount} article{itemCount > 1 ? "s" : ""}
        </p>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Articles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-stone-200 px-4 sm:px-6">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mt-4 transition-colors"
            >
              <ArrowLeft size={16} />
              Continuer mes achats
            </Link>
          </div>

          {/* Résumé */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-28">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">
                Résumé
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Livraison</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">Offerte</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-stone-400">
                    Livraison offerte dès {formatPrice(150)}
                  </p>
                )}
                <div className="border-t border-stone-100 pt-3 flex justify-between font-semibold text-stone-900 text-base">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Link
                href="/panier/checkout"
                className="mt-6 w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
              >
                Commander
                <ArrowRight size={18} />
              </Link>

              <p className="text-xs text-stone-400 text-center mt-3">
                Paiement sécurisé par Alma
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

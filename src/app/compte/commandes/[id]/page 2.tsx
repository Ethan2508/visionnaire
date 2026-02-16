"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_STYLES } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
}

interface StatusHistory {
  id: string;
  status: string;
  created_at: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  delivery_method: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  tracking_number: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_street: string | null;
  shipping_street_2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
  order_items: OrderItem[];
  order_status_history: StatusHistory[];
}

const statusLabels = ORDER_STATUS_STYLES;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login?redirect=/compte");
            return;
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrder(data.order);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-stone-500 mb-4">Commande introuvable</p>
          <Link href="/compte" className="text-stone-900 underline">
            Retour à mon compte
          </Link>
        </div>
      </main>
    );
  }

  const status = statusLabels[order.status] || {
    label: order.status,
    color: "bg-stone-100 text-stone-600",
  };

  return (
    <main className="min-h-screen bg-stone-50 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/compte"
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              router.push("/compte");
              // Set tab to commandes after navigation
              setTimeout(() => {
                const tabBtn = document.querySelector('[data-tab="commandes"]');
                if (tabBtn) (tabBtn as HTMLButtonElement).click();
              }, 100);
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                {order.order_number}
              </h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-0.5">
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-xl border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Package size={16} />
                Articles ({order.order_items.length})
              </h2>
            </div>
            <div className="divide-y divide-stone-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{item.product_name}</p>
                    {item.variant_info && (
                      <p className="text-xs text-stone-500 mt-0.5">{item.variant_info}</p>
                    )}
                    {item.quantity > 1 && (
                      <p className="text-xs text-stone-400 mt-0.5">Quantité : {item.quantity}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-stone-900 shrink-0">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé financier */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Livraison</span>
                <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Offerte"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-100 font-semibold text-stone-900 text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Suivi */}
          {order.tracking_number && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
                <Truck size={16} />
                Suivi de livraison
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-stone-600">
                  Numéro de suivi : <span className="font-medium text-stone-900">{order.tracking_number}</span>
                </p>
                {order.tracking_number.startsWith("1Z") && (
                  <a
                    href={`https://www.ups.com/track?tracknum=${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Suivre <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Adresse de livraison */}
          {order.delivery_method === "domicile" && order.shipping_street && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
                <MapPin size={16} />
                Adresse de livraison
              </h2>
              <div className="text-sm text-stone-600 space-y-0.5">
                <p>{order.shipping_first_name} {order.shipping_last_name}</p>
                <p>{order.shipping_street}</p>
                {order.shipping_street_2 && <p>{order.shipping_street_2}</p>}
                <p>{order.shipping_postal_code} {order.shipping_city}</p>
                <p>{order.shipping_country}</p>
              </div>
            </div>
          )}

          {order.delivery_method === "boutique" && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
                <MapPin size={16} />
                Retrait en boutique
              </h2>
              <div className="text-sm text-stone-600">
                <p className="font-medium text-stone-900">Visionnaire Opticiens</p>
                <p>Lyon, France</p>
              </div>
            </div>
          )}

          {/* Historique des statuts */}
          {order.order_status_history.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-3">
                <Clock size={16} />
                Historique
              </h2>
              <div className="space-y-3">
                {order.order_status_history
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((entry) => {
                    const s = statusLabels[entry.status] || {
                      label: entry.status,
                      color: "bg-stone-100 text-stone-600",
                    };
                    return (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Infos paiement/livraison */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Paiement</p>
                <p className="text-stone-900 font-medium">
                  {order.payment_method === "alma" ? "Alma" : order.payment_method === "stripe" ? "Carte bancaire" : order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Livraison</p>
                <p className="text-stone-900 font-medium">
                  {order.delivery_method === "domicile" ? "À domicile" : "Retrait en boutique"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

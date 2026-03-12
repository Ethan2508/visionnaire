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
  FileText,
  RotateCcw,
  X,
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

interface ReturnItem {
  order_item_id: string;
  quantity: number;
  product_name: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour le retour
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState(false);

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

  // Vérifier l'éligibilité au retour
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  const canRequestReturn = order.status === "livree" && daysSinceOrder <= 14;
  const daysRemaining = 14 - daysSinceOrder;

  // Ouvrir le modal de retour
  const openReturnModal = () => {
    setSelectedItems(order.order_items.map(item => ({
      order_item_id: item.id,
      quantity: item.quantity,
      product_name: item.product_name,
    })));
    setReturnReason("");
    setReturnError(null);
    setReturnSuccess(false);
    setShowReturnModal(true);
  };

  // Soumettre la demande de retour
  const submitReturn = async () => {
    if (!returnReason.trim()) {
      setReturnError("Veuillez indiquer le motif du retour");
      return;
    }

    const itemsToReturn = selectedItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      setReturnError("Veuillez sélectionner au moins un article");
      return;
    }

    setSubmittingReturn(true);
    setReturnError(null);

    try {
      const res = await fetch("/api/account/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason: returnReason,
          items: itemsToReturn.map(item => ({
            order_item_id: item.order_item_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReturnError(data.error || "Une erreur est survenue");
        setSubmittingReturn(false);
        return;
      }

      setReturnSuccess(true);
      setTimeout(() => {
        setShowReturnModal(false);
      }, 2000);
    } catch {
      setReturnError("Une erreur est survenue");
    } finally {
      setSubmittingReturn(false);
    }
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

          {/* Télécharger la facture */}
          {order.status !== "en_attente_paiement" && order.status !== "annulee" && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <a
                href={`/api/orders/${order.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-stone-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                <FileText size={16} />
                Télécharger ma facture
              </a>
            </div>
          )}

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

          {/* Demande de retour */}
          {canRequestReturn && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <RotateCcw size={16} />
                    Retourner un article
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {daysRemaining > 0 
                      ? `Il vous reste ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} pour retourner vos articles`
                      : "Dernier jour pour retourner vos articles"
                    }
                  </p>
                </div>
                <button
                  onClick={openReturnModal}
                  className="px-4 py-2 bg-stone-100 text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Demander un retour
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de demande de retour */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900">Demande de retour</h2>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {returnSuccess ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Demande envoyée !</h3>
                <p className="text-sm text-stone-500">
                  Nous avons bien reçu votre demande de retour. Vous recevrez un email de confirmation sous 48h.
                </p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {returnError && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                    {returnError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Articles à retourner
                  </label>
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div key={item.order_item_id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <span className="text-sm text-stone-900">{item.product_name}</span>
                        <select
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...selectedItems];
                            newItems[index].quantity = parseInt(e.target.value);
                            setSelectedItems(newItems);
                          }}
                          className="text-sm border border-stone-300 rounded px-2 py-1"
                        >
                          <option value={0}>Ne pas retourner</option>
                          {Array.from({ length: order.order_items.find(i => i.id === item.order_item_id)?.quantity || 1 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Motif du retour *
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Expliquez la raison de votre retour..."
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  />
                </div>

                <div className="bg-stone-50 p-4 rounded-lg text-xs text-stone-500 space-y-1">
                  <p>• Les articles doivent être retournés dans leur état d'origine</p>
                  <p>• Le remboursement sera effectué sous 14 jours après réception</p>
                  <p>• Les frais de retour sont à votre charge</p>
                </div>

                <button
                  onClick={submitReturn}
                  disabled={submittingReturn}
                  className="w-full bg-stone-900 text-white py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReturn ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

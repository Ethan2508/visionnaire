"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice, orderStatusLabel } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  ExternalLink,
} from "lucide-react";

interface EyeCorrection {
  sph: string;
  cyl: string;
  axe: string;
  add: string;
}

interface PrescriptionData {
  method: string;
  visionType: string;
  od: EyeCorrection;
  og: EyeCorrection;
  pupillaryDistance: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  lens_type: string | null;
  lens_options_summary: string | null;
  lens_options_price: number | null;
  prescription_url: string | null;
  prescription_validated: boolean | null;
  prescription_data: PrescriptionData | null;
}

interface StatusHistory {
  id: string;
  status: string;
  comment: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_method: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  tracking_number: string | null;
  notes: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_street: string | null;
  shipping_street_2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; email: string; phone: string | null } | null;
  order_items: OrderItem[];
  order_status_history: StatusHistory[];
}

const statusColors: Record<string, string> = {
  en_attente_paiement: "bg-yellow-100 text-yellow-800",
  payee: "bg-blue-100 text-blue-800",
  ordonnance_en_validation: "bg-orange-100 text-orange-800",
  ordonnance_validee: "bg-green-100 text-green-800",
  ordonnance_refusee: "bg-red-100 text-red-800",
  en_fabrication: "bg-indigo-100 text-indigo-800",
  expediee: "bg-purple-100 text-purple-800",
  prete_en_boutique: "bg-teal-100 text-teal-800",
  livree: "bg-emerald-100 text-emerald-800",
  annulee: "bg-stone-100 text-stone-500",
};

// Statuts possibles selon le statut actuel
const nextStatuses: Record<string, string[]> = {
  en_attente_paiement: ["payee", "annulee"],
  payee: ["ordonnance_en_validation", "en_fabrication", "annulee"],
  ordonnance_en_validation: ["ordonnance_validee", "ordonnance_refusee"],
  ordonnance_validee: ["en_fabrication"],
  ordonnance_refusee: ["ordonnance_en_validation", "annulee"],
  en_fabrication: ["expediee", "prete_en_boutique"],
  expediee: ["livree"],
  prete_en_boutique: ["livree"],
  livree: [],
  annulee: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(first_name, last_name, email, phone),
        order_items(*),
        order_status_history(*)
      `)
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error loading order:", error);
      setLoading(false);
      return;
    }

    const o = data as unknown as Order;
    setOrder(o);
    setTrackingNumber(o.tracking_number || "");
    setNotes(o.notes || "");

    // Sort history by date
    o.order_status_history.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);

    const supabase = createClient();

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus } as never)
      .eq("id", order.id);

    if (updateError) {
      alert("Erreur lors de la mise à jour du statut");
      setUpdating(false);
      return;
    }

    // Add status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: newStatus,
      comment: statusComment || null,
    } as never);

    setStatusComment("");
    await loadOrder();
    setUpdating(false);
  }

  async function validatePrescription(itemId: string, validated: boolean) {
    const supabase = createClient();
    await supabase
      .from("order_items")
      .update({ prescription_validated: validated } as never)
      .eq("id", itemId);

    await loadOrder();
  }

  async function saveOrderDetails() {
    if (!order) return;
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        tracking_number: trackingNumber || null,
        notes: notes || null,
      } as never)
      .eq("id", order.id);

    await loadOrder();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-stone-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-stone-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 mb-4">Commande introuvable</p>
        <Link href="/admin/commandes" className="text-stone-900 underline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const hasPrescription = order.order_items.some((item) => item.prescription_url);
  const available = nextStatuses[order.status] || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/commandes" className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900">{order.order_number}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
              {orderStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-xl border border-stone-200">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Package size={16} />
                Articles ({order.order_items.length})
              </h2>
            </div>
            <div className="divide-y divide-stone-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="px-4 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{item.product_name}</p>
                      {item.variant_info && (
                        <p className="text-xs text-stone-500 mt-0.5">{item.variant_info}</p>
                      )}
                      {item.lens_type && (
                        <p className="text-xs text-blue-600 mt-1">
                          Verres : {item.lens_type}
                          {item.lens_options_summary && ` — ${item.lens_options_summary}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-stone-900">
                        {formatPrice(item.unit_price + (item.lens_options_price || 0))}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-stone-500">x{item.quantity}</p>
                      )}
                    </div>
                  </div>

                  {/* Corrections manuelles */}
                  {item.prescription_data && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                        <FileText size={14} />
                        Corrections saisies ({item.prescription_data.visionType === 'simple' ? 'Vision simple' : item.prescription_data.visionType === 'progressive' ? 'Progressive' : item.prescription_data.visionType})
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {(['od', 'og'] as const).map((eye) => (
                          <div key={eye} className="text-xs">
                            <p className="font-semibold text-blue-900 mb-1">{eye === 'od' ? 'Œil droit (OD)' : 'Œil gauche (OG)'}</p>
                            <div className="grid grid-cols-2 gap-1 text-blue-700">
                              <span>SPH: {item.prescription_data![eye].sph || '—'}</span>
                              <span>CYL: {item.prescription_data![eye].cyl || '—'}</span>
                              <span>AXE: {item.prescription_data![eye].axe || '—'}</span>
                              <span>ADD: {item.prescription_data![eye].add || '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {item.prescription_data.pupillaryDistance && (
                        <p className="text-xs text-blue-600 mt-2">Écart pupillaire : {item.prescription_data.pupillaryDistance} mm</p>
                      )}
                    </div>
                  )}

                  {/* Ordonnance */}
                  {item.prescription_url && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-stone-500" />
                          <span className="text-xs font-medium text-stone-700">Ordonnance</span>
                          {item.prescription_validated === true && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Validée</span>
                          )}
                          {item.prescription_validated === false && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Refusée</span>
                          )}
                          {item.prescription_validated === null && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">En attente</span>
                          )}
                        </div>
                        <a
                          href={item.prescription_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Voir <ExternalLink size={12} />
                        </a>
                      </div>
                      {item.prescription_validated === null && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => validatePrescription(item.id, true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle size={12} />
                            Valider
                          </button>
                          <button
                            onClick={() => validatePrescription(item.id, false)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle size={12} />
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Changement de statut */}
          {available.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Changer le statut</h2>
              <textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Commentaire (optionnel)..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 mb-3"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {available.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      status === "annulee"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    {orderStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Historique des statuts */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Historique
            </h2>
            <div className="space-y-3">
              {order.order_status_history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[entry.status]}`}>
                        {orderStatusLabel(entry.status)}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="text-xs text-stone-500 mt-0.5">{entry.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne laterale */}
        <div className="space-y-6">
          {/* Resume financier */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <CreditCard size={16} />
              Résumé
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Sous-total</span>
                <span className="text-stone-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Livraison</span>
                <span className="text-stone-900">{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Offerte"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="font-bold text-stone-900">{formatPrice(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
              <p>Paiement : {order.payment_method === "stripe" ? "Carte bancaire" : "Alma"}</p>
              <p>Livraison : {order.delivery_method === "domicile" ? "À domicile" : "Retrait boutique"}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <User size={16} />
              Client
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-stone-900">
                {order.profiles?.first_name} {order.profiles?.last_name}
              </p>
              <p className="text-stone-500">{order.profiles?.email}</p>
              {order.profiles?.phone && (
                <p className="text-stone-500">{order.profiles.phone}</p>
              )}
            </div>
          </div>

          {/* Adresse livraison */}
          {order.delivery_method === "domicile" && order.shipping_street && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
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

          {/* Suivi & Notes */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Truck size={16} />
              Suivi & Notes
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Numéro de suivi</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ex: 1Z999AA..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Notes internes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes visibles uniquement par l'admin..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                  rows={3}
                />
              </div>
              <button
                onClick={saveOrderDetails}
                className="w-full bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

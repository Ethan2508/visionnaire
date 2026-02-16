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
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  lens_type: string | null;
  lens_options_summary: string | null;
  lens_options_price: number | null;
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
  en_preparation: "bg-indigo-100 text-indigo-800",
  expediee: "bg-purple-100 text-purple-800",
  prete_en_boutique: "bg-teal-100 text-teal-800",
  livree: "bg-emerald-100 text-emerald-800",
  annulee: "bg-stone-100 text-stone-500",
};

// Statuts possibles selon le statut actuel
const nextStatuses: Record<string, string[]> = {
  en_attente_paiement: ["payee", "annulee"],
  payee: ["en_preparation", "annulee"],
  en_preparation: ["expediee", "prete_en_boutique"],
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
    // Removed - prescriptions no longer used
  }

  async function saveOrderDetails() {
    if (!order) return;
    const supabase = createClient();

    // Si un numéro de suivi est ajouté, passer automatiquement en "expédiée"
    const updates: Record<string, unknown> = {
      tracking_number: trackingNumber || null,
      notes: notes || null,
    };

    await supabase
      .from("orders")
      .update(updates as never)
      .eq("id", order.id);

    // Auto-expédié quand un tracking number est ajouté et que le statut est en_preparation ou payee
    if (trackingNumber && !order.tracking_number && ["payee", "en_preparation"].includes(order.status)) {
      await supabase
        .from("orders")
        .update({ status: "expediee" } as never)
        .eq("id", order.id);

      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "expediee",
        comment: `Numéro de suivi ajouté : ${trackingNumber}`,
      } as never);
    }

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

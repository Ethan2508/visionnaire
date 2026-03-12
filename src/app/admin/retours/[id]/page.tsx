"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Euro,
  Send,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
}

interface ReturnRequest {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  items: { order_item_id: string; quantity: number }[];
  admin_comment: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  orders: {
    id: string;
    order_number: string;
    total: number;
    order_items: OrderItem[];
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof RotateCcw }> = {
  demande: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  accepte: { label: "Accepté", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  refuse: { label: "Refusé", color: "bg-red-100 text-red-800", icon: XCircle },
  recu: { label: "Reçu", color: "bg-purple-100 text-purple-800", icon: Package },
  rembourse: { label: "Remboursé", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function AdminReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;

  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    loadReturn();
  }, [returnId]);

  async function loadReturn() {
    try {
      const res = await fetch(`/api/admin/returns/${returnId}`);
      if (res.ok) {
        const data = await res.json();
        setReturnRequest(data.returnRequest);
        setAdminComment(data.returnRequest.admin_comment || "");
        
        // Calculer le montant de remboursement par défaut
        if (!data.returnRequest.refund_amount) {
          const items = data.returnRequest.items as { order_item_id: string; quantity: number }[];
          const orderItems = data.returnRequest.orders.order_items as OrderItem[];
          let total = 0;
          items.forEach(item => {
            const orderItem = orderItems.find(oi => oi.id === item.order_item_id);
            if (orderItem) {
              total += orderItem.unit_price * item.quantity;
            }
          });
          setRefundAmount(total.toFixed(2));
        } else {
          setRefundAmount(data.returnRequest.refund_amount.toString());
        }
      }
    } catch (error) {
      console.error("Error loading return:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!returnRequest) return;
    
    if (newStatus === "rembourse" && !refundAmount) {
      alert("Veuillez indiquer le montant du remboursement");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/returns/${returnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminComment || undefined,
          refundAmount: newStatus === "rembourse" ? parseFloat(refundAmount) : undefined,
        }),
      });

      if (res.ok) {
        await loadReturn();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating return:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (!returnRequest) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 mb-4">Demande de retour introuvable</p>
        <Link href="/admin/retours" className="text-stone-900 underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[returnRequest.status] || statusConfig.demande;
  const StatusIcon = statusInfo.icon;

  // Calculer le montant des articles retournés
  const returnedItems = returnRequest.items.map(item => {
    const orderItem = returnRequest.orders.order_items.find(oi => oi.id === item.order_item_id);
    return {
      ...item,
      product_name: orderItem?.product_name || "Article inconnu",
      variant_info: orderItem?.variant_info,
      unit_price: orderItem?.unit_price || 0,
    };
  });

  const totalReturnValue = returnedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/retours" className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900">
              Retour - {returnRequest.orders.order_number}
            </h1>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
              <StatusIcon size={14} />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            Demande du {new Date(returnRequest.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Motif du retour */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Motif du retour</h2>
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{returnRequest.reason}</p>
          </div>

          {/* Articles concernés */}
          <div className="bg-white rounded-xl border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Package size={16} />
                Articles à retourner
              </h2>
            </div>
            <div className="divide-y divide-stone-100">
              {returnedItems.map((item, index) => (
                <div key={index} className="px-5 py-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{item.product_name}</p>
                    {item.variant_info && (
                      <p className="text-xs text-stone-500 mt-0.5">{item.variant_info}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-0.5">Quantité : {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-stone-900 shrink-0">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-stone-100 bg-stone-50">
              <div className="flex justify-between text-sm font-semibold text-stone-900">
                <span>Valeur totale du retour</span>
                <span>{formatPrice(totalReturnValue)}</span>
              </div>
            </div>
          </div>

          {/* Actions selon le statut */}
          {returnRequest.status === "demande" && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Répondre à la demande</h2>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Commentaire (optionnel, envoyé au client)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Ex: Raison du refus..."
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus("accepte")}
                  disabled={updating}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Accepter
                </button>
                <button
                  onClick={() => updateStatus("refuse")}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Refuser
                </button>
              </div>
            </div>
          )}

          {returnRequest.status === "accepte" && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">En attente de réception</h2>
              <p className="text-sm text-stone-500 mb-4">
                Le client a été notifié. Marquez le retour comme reçu une fois le colis arrivé.
              </p>
              <button
                onClick={() => updateStatus("recu")}
                disabled={updating}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Package size={18} />
                Marquer comme reçu
              </button>
            </div>
          )}

          {returnRequest.status === "recu" && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Effectuer le remboursement</h2>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Montant à rembourser *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 pl-8 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <Euro size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Valeur des articles : {formatPrice(totalReturnValue)}
                </p>
              </div>

              <p className="text-xs text-stone-500 mb-4 bg-yellow-50 p-3 rounded-lg">
                ⚠️ Effectuez le remboursement manuellement via Alma ou Stripe, puis cliquez sur le bouton ci-dessous pour notifier le client.
              </p>

              <button
                onClick={() => updateStatus("rembourse")}
                disabled={updating || !refundAmount}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Confirmer le remboursement
              </button>
            </div>
          )}

          {returnRequest.status === "rembourse" && returnRequest.refund_amount && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <h2 className="text-sm font-semibold text-green-900">Remboursement effectué</h2>
                  <p className="text-sm text-green-700">
                    {formatPrice(returnRequest.refund_amount)} remboursés le {new Date(returnRequest.updated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {returnRequest.status === "refuse" && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-red-600" />
                <div>
                  <h2 className="text-sm font-semibold text-red-900">Demande refusée</h2>
                  {returnRequest.admin_comment && (
                    <p className="text-sm text-red-700">{returnRequest.admin_comment}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale - Infos client */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-4">
              <User size={16} />
              Client
            </h2>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-stone-900">
                {returnRequest.profiles.first_name} {returnRequest.profiles.last_name}
              </p>
              <a
                href={`mailto:${returnRequest.profiles.email}`}
                className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
              >
                <Mail size={14} />
                {returnRequest.profiles.email}
              </a>
              {returnRequest.profiles.phone && (
                <a
                  href={`tel:${returnRequest.profiles.phone}`}
                  className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
                >
                  <Phone size={14} />
                  {returnRequest.profiles.phone}
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Commande</h2>
            <Link
              href={`/admin/commandes/${returnRequest.order_id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Voir la commande {returnRequest.orders.order_number}
            </Link>
            <p className="text-sm text-stone-500 mt-1">
              Total : {formatPrice(returnRequest.orders.total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

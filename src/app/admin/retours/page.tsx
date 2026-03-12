"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Inbox,
} from "lucide-react";

interface ReturnRequest {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  items: { order_item_id: string; quantity: number }[];
  admin_comment: string | null;
  refund_amount: number | null;
  created_at: string;
  orders: { order_number: string; total: number };
  profiles: { first_name: string | null; last_name: string | null; email: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof RotateCcw }> = {
  demande: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  accepte: { label: "Accepté", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  refuse: { label: "Refusé", color: "bg-red-100 text-red-800", icon: XCircle },
  recu: { label: "Reçu", color: "bg-purple-100 text-purple-800", icon: Package },
  rembourse: { label: "Remboursé", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadReturns();
  }, []);

  async function loadReturns() {
    try {
      const res = await fetch("/api/admin/returns");
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns);
      }
    } catch (error) {
      console.error("Error loading returns:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredReturns = returns.filter(r => {
    if (filter === "all") return true;
    if (filter === "pending") return r.status === "demande";
    if (filter === "processing") return ["accepte", "recu"].includes(r.status);
    if (filter === "completed") return ["refuse", "rembourse"].includes(r.status);
    return true;
  });

  const pendingCount = returns.filter(r => r.status === "demande").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Demandes de retour</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-stone-500 mt-1">
              {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
            </p>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "Toutes" },
          { value: "pending", label: "En attente" },
          { value: "processing", label: "En cours" },
          { value: "completed", label: "Terminées" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.value
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredReturns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <Inbox size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500">Aucune demande de retour</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="divide-y divide-stone-100">
            {filteredReturns.map(ret => {
              const statusInfo = statusConfig[ret.status] || statusConfig.demande;
              const StatusIcon = statusInfo.icon;
              
              return (
                <Link
                  key={ret.id}
                  href={`/admin/retours/${ret.id}`}
                  className="flex items-center px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-stone-900">
                        {ret.orders.order_number}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span>
                        {ret.profiles.first_name} {ret.profiles.last_name}
                      </span>
                      <span>•</span>
                      <span>{formatPrice(ret.orders.total)}</span>
                      <span>•</span>
                      <span>
                        {new Date(ret.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mt-1 truncate">
                      {ret.reason}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-stone-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

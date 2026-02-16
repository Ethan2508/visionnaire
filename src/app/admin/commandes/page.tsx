"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Eye, Package, Search } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_method: string;
  payment_method: string;
  total: number;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; email: string } | null;
}

const statusLabels: Record<string, string> = {
  en_attente_paiement: "En attente de paiement",
  payee: "Payée",

  expediee: "Expédiée",
  prete_en_boutique: "Prête en boutique",
  livree: "Livrée",
  annulee: "Annulée",
};

const statusColors: Record<string, string> = {
  en_attente_paiement: "bg-yellow-100 text-yellow-800",
  payee: "bg-blue-100 text-blue-800",

  expediee: "bg-purple-100 text-purple-800",
  prete_en_boutique: "bg-teal-100 text-teal-800",
  livree: "bg-emerald-100 text-emerald-800",
  annulee: "bg-stone-100 text-stone-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, delivery_method, payment_method, total, created_at, profiles(first_name, last_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
    }

    setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${o.profiles?.first_name || ""} ${o.profiles?.last_name || ""}`.toLowerCase();
      const email = (o.profiles?.email || "").toLowerCase();
      if (!o.order_number.toLowerCase().includes(q) && !name.includes(q) && !email.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Commandes</h1>
          <p className="text-sm text-stone-500 mt-1">{orders.length} commande{orders.length > 1 ? "s" : ""} au total</p>
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Toutes ({orders.length})
        </button>
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === status ? "bg-stone-900 text-white" : `${statusColors[status] || "bg-stone-100 text-stone-600"} hover:opacity-80`
            }`}
          >
            {statusLabels[status] || status} ({count})
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro, nom ou email..."
          className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Package size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500">Aucune commande trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/admin/commandes/${order.id}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-900">{order.order_number}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-stone-100 text-stone-600"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                  <span>
                    {order.profiles?.first_name} {order.profiles?.last_name}
                  </span>
                  <span>·</span>
                  <span>{order.profiles?.email}</span>
                  <span>·</span>
                  <span>{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-stone-900 shrink-0">
                {formatPrice(order.total)}
              </span>
              <Eye size={16} className="text-stone-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

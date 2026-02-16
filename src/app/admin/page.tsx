"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  CalendarDays,
  AlertTriangle,
  Eye,
  ArrowRight,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  totalClients: number;
  totalProducts: number;
  lowStockCount: number;
  todayAppointments: number;
  recentOrders: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  }[];
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

const statusLabels: Record<string, string> = {
  en_attente_paiement: "En attente",
  payee: "Payée",
  en_preparation: "Préparation",
  expediee: "Expédiée",
  prete_en_boutique: "Prête",
  livree: "Livrée",
  annulee: "Annulée",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = now.toISOString().split("T")[0];

    const [
      ordersRes,
      pendingRes,
      revenueRes,
      monthRevenueRes,
      clientsRes,
      productsRes,
      lowStockRes,
      appointmentsRes,
      recentRes,
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["en_attente_paiement", "payee"]),
      supabase.from("orders").select("total").not("status", "eq", "annulee"),
      supabase.from("orders").select("total").not("status", "eq", "annulee").gte("created_at", monthStart),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "client"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("product_variants").select("*", { count: "exact", head: true }).lt("stock_quantity", 5).eq("is_active", true),
      supabase.from("appointments").select("*, appointment_slots!inner(date)").eq("appointment_slots.date", today).eq("status", "confirmee"),
      supabase.from("orders").select("id, order_number, status, total, created_at, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(8),
    ]);

    const totalRevenue = (revenueRes.data as { total: number }[] || []).reduce((s, o) => s + Number(o.total), 0);
    const monthRevenue = (monthRevenueRes.data as { total: number }[] || []).reduce((s, o) => s + Number(o.total), 0);

    setStats({
      totalOrders: ordersRes.count || 0,
      pendingOrders: pendingRes.count || 0,
      totalRevenue,
      monthRevenue,
      totalClients: clientsRes.count || 0,
      totalProducts: productsRes.count || 0,
      lowStockCount: lowStockRes.count || 0,
      todayAppointments: (appointmentsRes.data || []).length,
      recentOrders: (recentRes.data as unknown as DashboardStats["recentOrders"]) || [],
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-stone-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-stone-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-stone-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: "Chiffre d'affaires", value: formatPrice(stats.totalRevenue), sub: `${formatPrice(stats.monthRevenue)} ce mois`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Commandes", value: String(stats.totalOrders), sub: `${stats.pendingOrders} en attente`, icon: ShoppingCart, color: "text-blue-600 bg-blue-50", href: "/admin/commandes" },
    { label: "Clients", value: String(stats.totalClients), sub: `${stats.totalProducts} produits actifs`, icon: Users, color: "text-purple-600 bg-purple-50", href: "/admin/clients" },
    { label: "RDV aujourd'hui", value: String(stats.todayAppointments), sub: "Rendez-vous confirmés", icon: CalendarDays, color: "text-amber-600 bg-amber-50", href: "/admin/rendez-vous" },
  ];

  const alerts = [
    stats.lowStockCount > 0 && { label: `${stats.lowStockCount} variante${stats.lowStockCount > 1 ? "s" : ""} en stock faible (< 5)`, href: "/admin/produits", icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
  ].filter(Boolean) as { label: string; href: string; icon: typeof AlertTriangle; color: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Tableau de bord</h1>

      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert) => (
            <Link key={alert.label} href={alert.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-opacity hover:opacity-80 ${alert.color}`}>
              <alert.icon size={18} />
              <span className="text-sm font-medium flex-1">{alert.label}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const content = (
            <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color} mb-3`}>
                <kpi.icon size={20} />
              </div>
              <p className="text-2xl font-bold text-stone-900">{kpi.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-stone-400 mt-1">{kpi.sub}</p>
            </div>
          );
          return kpi.href ? <Link key={kpi.label} href={kpi.href}>{content}</Link> : <div key={kpi.label}>{content}</div>;
        })}
      </div>

      <div className="bg-white rounded-xl border border-stone-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2"><Clock size={16} />Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">Tout voir <ArrowRight size={12} /></Link>
        </div>
        <div className="divide-y divide-stone-100">
          {stats.recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center"><Package size={32} className="mx-auto text-stone-300 mb-2" /><p className="text-sm text-stone-500">Aucune commande</p></div>
          ) : (
            stats.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/commandes/${order.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-stone-900">{order.order_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{order.profiles?.first_name} {order.profiles?.last_name} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="text-sm font-semibold text-stone-900 shrink-0">{formatPrice(order.total)}</span>
                <Eye size={14} className="text-stone-400 shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

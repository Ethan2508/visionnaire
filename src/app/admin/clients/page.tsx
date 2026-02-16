"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, User, ShoppingBag, Loader2, Mail, Phone, Shield, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();

    // Fetch profiles
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

    // Fetch orders grouped by profile
    const { data: orders } = await supabase.from("orders").select("profile_id, total_amount") as { data: { profile_id: string; total_amount: number }[] | null };

    const orderStats: Record<string, { count: number; total: number }> = {};
    if (orders) {
      for (const o of orders) {
        if (!orderStats[o.profile_id]) orderStats[o.profile_id] = { count: 0, total: 0 };
        orderStats[o.profile_id].count += 1;
        orderStats[o.profile_id].total += o.total_amount || 0;
      }
    }

    const mapped: Client[] = (profiles || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      first_name: (p.first_name as string) || "",
      last_name: (p.last_name as string) || "",
      email: (p.email as string) || "",
      phone: (p.phone as string) || null,
      role: (p.role as string) || "client",
      created_at: p.created_at as string,
      order_count: orderStats[p.id as string]?.count || 0,
      total_spent: orderStats[p.id as string]?.total || 0,
    }));

    setClients(mapped);
    setLoading(false);
  }

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  async function toggleRole(client: Client) {
    const newRole = client.role === "admin" ? "client" : "admin";
    if (!confirm(`Passer ${client.first_name} ${client.last_name} en ${newRole} ?`)) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ role: newRole } as never).eq("id", client.id);
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, role: newRole } : c)));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Clients</h1>
        <span className="text-sm text-stone-500">{clients.length} client{clients.length > 1 ? "s" : ""}</span>
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, email, téléphone…" className="w-full pl-9 pr-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500">Total clients</p>
          <p className="text-xl font-bold text-stone-900">{clients.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500">Admins</p>
          <p className="text-xl font-bold text-stone-900">{clients.filter((c) => c.role === "admin").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500">Avec commandes</p>
          <p className="text-xl font-bold text-stone-900">{clients.filter((c) => c.order_count > 0).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs text-stone-500">CA total</p>
          <p className="text-xl font-bold text-stone-900">{formatPrice(clients.reduce((s, c) => s + c.total_spent, 0))}</p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 hidden md:table-cell">Contact</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-stone-500">Commandes</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-stone-500 hidden sm:table-cell">Dépensé</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-stone-500">Rôle</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-stone-500 hidden lg:table-cell">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600">
                      {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{client.first_name} {client.last_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-stone-600 flex items-center gap-1"><Mail size={12} /> {client.email}</p>
                  {client.phone && <p className="text-stone-400 flex items-center gap-1 text-xs"><Phone size={10} /> {client.phone}</p>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1"><ShoppingBag size={12} className="text-stone-400" /> {client.order_count}</span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell font-medium text-stone-900">
                  {client.total_spent > 0 ? formatPrice(client.total_spent) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleRole(client)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${client.role === "admin" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                    {client.role === "admin" && <Shield size={10} />}
                    {client.role}
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-xs text-stone-400 hidden lg:table-cell">
                  <span className="flex items-center gap-1 justify-end"><Calendar size={10} /> {new Date(client.created_at).toLocaleDateString("fr-FR")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun client trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

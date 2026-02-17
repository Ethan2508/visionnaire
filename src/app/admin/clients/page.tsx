"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, User, ShoppingBag, Loader2, Mail, Phone, Shield, Calendar, X, Key, Eye } from "lucide-react";
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

interface ClientOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
}

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  async function openClientDetails(client: Client) {
    setSelectedClient(client);
    setResetSent(false);
    setLoadingOrders(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, total_amount, status")
      .eq("profile_id", client.id)
      .order("created_at", { ascending: false });
    setClientOrders((data as ClientOrder[]) || []);
    setLoadingOrders(false);
  }

  async function sendPasswordReset() {
    if (!selectedClient) return;
    setSendingReset(true);
    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedClient.email }),
      });
      if (res.ok) {
        setResetSent(true);
      } else {
        alert("Erreur lors de l'envoi du mail de réinitialisation");
      }
    } catch {
      alert("Erreur réseau");
    }
    setSendingReset(false);
  }

  function closeModal() {
    setSelectedClient(null);
    setClientOrders([]);
    setResetSent(false);
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
              <th className="text-right px-4 py-3 text-xs font-medium text-stone-500">Actions</th>
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
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openClientDetails(client)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors">
                    <Eye size={12} /> Voir
                  </button>
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

      {/* Modal détail client */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-lg font-bold text-stone-600">
                    {selectedClient.first_name.charAt(0)}{selectedClient.last_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{selectedClient.first_name} {selectedClient.last_name}</h2>
                    <p className="text-sm text-stone-500">{selectedClient.role === "admin" ? "Administrateur" : "Client"}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Infos contact */}
              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-stone-400" />
                  <span className="text-stone-700">{selectedClient.email}</span>
                </div>
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-stone-400" />
                    <span className="text-stone-700">{selectedClient.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-stone-400" />
                  <span className="text-stone-700">Inscrit le {new Date(selectedClient.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">{selectedClient.order_count}</p>
                  <p className="text-xs text-stone-500">Commande{selectedClient.order_count > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">{formatPrice(selectedClient.total_spent)}</p>
                  <p className="text-xs text-stone-500">Dépensé</p>
                </div>
              </div>

              {/* Réinitialisation mot de passe */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Key size={14} /> Mot de passe
                </h3>
                {resetSent ? (
                  <p className="text-sm text-green-700">Email de réinitialisation envoyé à {selectedClient.email}</p>
                ) : (
                  <button
                    onClick={sendPasswordReset}
                    disabled={sendingReset}
                    className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {sendingReset ? "Envoi en cours..." : "Envoyer un lien de réinitialisation"}
                  </button>
                )}
              </div>

              {/* Commandes récentes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">Commandes récentes</h3>
                {loadingOrders ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-stone-400" size={20} />
                  </div>
                ) : clientOrders.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-4">Aucune commande</p>
                ) : (
                  <div className="space-y-2">
                    {clientOrders.slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/commandes?id=${order.id}`}
                        className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-900">{formatPrice(order.total_amount)}</p>
                          <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "payee" ? "bg-green-100 text-green-800" :
                          order.status === "expediee" ? "bg-blue-100 text-blue-800" :
                          order.status === "livree" ? "bg-emerald-100 text-emerald-800" :
                          "bg-stone-100 text-stone-600"
                        }`}>
                          {order.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

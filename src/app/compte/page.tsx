"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Loader2,
  Edit3,
  Check,
  X,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface Address {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  street: string;
  street_2: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" },
  payee: { label: "Payée", color: "bg-blue-100 text-blue-800" },
  ordonnance_en_validation: { label: "Ordonnance en validation", color: "bg-orange-100 text-orange-800" },
  ordonnance_validee: { label: "Ordonnance validée", color: "bg-green-100 text-green-800" },
  ordonnance_refusee: { label: "Ordonnance refusée", color: "bg-red-100 text-red-800" },
  en_fabrication: { label: "En fabrication", color: "bg-indigo-100 text-indigo-800" },
  expediee: { label: "Expédiée", color: "bg-purple-100 text-purple-800" },
  prete_en_boutique: { label: "Prête en boutique", color: "bg-teal-100 text-teal-800" },
  livree: { label: "Livrée", color: "bg-green-100 text-green-800" },
  annulee: { label: "Annulée", color: "bg-stone-100 text-stone-600" },
};

type Tab = "profil" | "commandes" | "adresses";

export default function ComptePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/account");
        if (!res.ok) {
          router.push("/auth/login?redirect=/compte");
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setOrders(data.orders);
        setAddresses(data.addresses);
        if (data.profile) {
          setForm({
            firstName: data.profile.first_name || "",
            lastName: data.profile.last_name || "",
            phone: data.profile.phone || "",
          });
        }
      } catch {
        router.push("/auth/login?redirect=/compte");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                first_name: form.firstName,
                last_name: form.lastName,
                phone: form.phone,
              }
            : null
        );
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </main>
    );
  }

  if (!profile) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profil", label: "Mon profil", icon: User },
    { key: "commandes", label: "Mes commandes", icon: Package },
    { key: "adresses", label: "Mes adresses", icon: MapPin },
  ];

  return (
    <main className="min-h-screen bg-stone-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">
              Mon compte
            </h1>
            <p className="text-stone-500 text-sm mt-1">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg border border-stone-200 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Profil */}
        {tab === "profil" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-stone-900">
                Informations personnelles
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <Edit3 size={14} />
                  Modifier
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg bg-stone-50 text-stone-400 cursor-not-allowed"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Enregistrer
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        firstName: profile.first_name || "",
                        lastName: profile.last_name || "",
                        phone: profile.phone || "",
                      });
                    }}
                    className="flex items-center gap-2 text-stone-500 px-5 py-2.5 rounded-lg font-medium hover:bg-stone-100 transition-colors"
                  >
                    <X size={16} />
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                      Prénom
                    </p>
                    <p className="text-stone-900 font-medium">
                      {profile.first_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                      Nom
                    </p>
                    <p className="text-stone-900 font-medium">
                      {profile.last_name || "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                    Téléphone
                  </p>
                  <p className="text-stone-900 font-medium">
                    {profile.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <p className="text-stone-900 font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
                    Membre depuis
                  </p>
                  <p className="text-stone-900 font-medium">
                    {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commandes */}
        {tab === "commandes" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <ShoppingBag
                  size={40}
                  className="mx-auto text-stone-300 mb-4"
                />
                <p className="text-stone-500 mb-4">
                  Aucune commande pour le moment
                </p>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
                >
                  Découvrir le catalogue
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const status = statusLabels[order.status] || {
                  label: order.status,
                  color: "bg-stone-100 text-stone-600",
                };
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-stone-200 p-5 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-stone-900">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                        <p className="font-semibold text-stone-900">
                          {formatPrice(order.total)}
                        </p>
                        <ChevronRight
                          size={16}
                          className="text-stone-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Adresses */}
        {tab === "adresses" && (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <MapPin size={40} className="mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500">
                  Aucune adresse enregistrée
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  Vos adresses seront ajoutées lors de votre première commande
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-xl border border-stone-200 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {addr.is_default && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                          Par défaut
                        </span>
                      )}
                      <p className="font-medium text-stone-900">
                        {addr.first_name} {addr.last_name}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">
                        {addr.street}
                        {addr.street_2 && `, ${addr.street_2}`}
                      </p>
                      <p className="text-sm text-stone-500">
                        {addr.postal_code} {addr.city}, {addr.country}
                      </p>
                    </div>
                    {addr.label && (
                      <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                        {addr.label}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

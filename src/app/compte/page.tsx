"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, ORDER_STATUS_STYLES } from "@/lib/utils";
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
  Plus,
  Trash2,
  Key,
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

const statusLabels = ORDER_STATUS_STYLES;

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

  // Address management state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    firstName: "",
    lastName: "",
    street: "",
    street2: "",
    city: "",
    postalCode: "",
    country: "France",
    isDefault: false,
  });

  // Password reset state
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  async function handlePasswordReset() {
    setResettingPassword(true);
    setResetSuccess(false);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email }),
      });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 5000);
      }
    } finally {
      setResettingPassword(false);
    }
  }

  function openAddressModal(address?: Address) {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label || "",
        firstName: address.first_name,
        lastName: address.last_name,
        street: address.street,
        street2: address.street_2 || "",
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
        isDefault: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: "",
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        street: "",
        street2: "",
        city: "",
        postalCode: "",
        country: "France",
        isDefault: addresses.length === 0,
      });
    }
    setShowAddressModal(true);
  }

  function closeAddressModal() {
    setShowAddressModal(false);
    setEditingAddress(null);
  }

  async function handleSaveAddress() {
    setSavingAddress(true);
    try {
      const payload = {
        label: addressForm.label || null,
        first_name: addressForm.firstName,
        last_name: addressForm.lastName,
        street: addressForm.street,
        street_2: addressForm.street2 || null,
        city: addressForm.city,
        postal_code: addressForm.postalCode,
        country: addressForm.country,
        is_default: addressForm.isDefault,
      };

      const res = editingAddress
        ? await fetch(`/api/account/addresses`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingAddress.id, ...payload }),
          })
        : await fetch("/api/account/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const newAddress = await res.json();
        if (editingAddress) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddress.id ? newAddress : a))
          );
        } else {
          setAddresses((prev) => [...prev, newAddress]);
        }
        closeAddressModal();
      }
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?"))
      return;

    try {
      const res = await fetch(`/api/account/addresses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
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

            {/* Password reset section */}
            {!editing && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <h3 className="text-sm font-semibold text-stone-900 mb-3">
                  Sécurité
                </h3>
                <button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword}
                  className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900 transition-colors disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Key size={16} />
                  )}
                  Changer de mot de passe
                </button>
                {resetSuccess && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
                    <Check size={14} />
                    Un email de réinitialisation a été envoyé
                  </p>
                )}
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
                  <Link
                    key={order.id}
                    href={`/compte/commandes/${order.id}`}
                    className="bg-white rounded-xl border border-stone-200 p-5 hover:border-stone-300 transition-colors block"
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
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Adresses */}
        {tab === "adresses" && (
          <div className="space-y-4">
            {/* Add address button */}
            <button
              onClick={() => openAddressModal()}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Ajouter une adresse
            </button>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <MapPin size={40} className="mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500">
                  Aucune adresse enregistrée
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  Ajoutez votre première adresse pour faciliter vos commandes
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-xl border border-stone-200 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {addr.is_default && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                          Par défaut
                        </span>
                      )}
                      {addr.label && (
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-1">
                          {addr.label}
                        </p>
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
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openAddressModal(addr)}
                        className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-stone-900">
                {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
              </h2>
              <button
                onClick={closeAddressModal}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Libellé <span className="text-stone-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, label: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  placeholder="Maison, Bureau, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.firstName}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        firstName: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.lastName}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        lastName: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  placeholder="Numéro et nom de rue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Complément d'adresse{" "}
                  <span className="text-stone-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={addressForm.street2}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street2: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  placeholder="Bâtiment, appartement, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        postalCode: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, country: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-900"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm text-stone-700 cursor-pointer"
                >
                  Définir comme adresse par défaut
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-stone-200 flex gap-3">
              <button
                onClick={handleSaveAddress}
                disabled={
                  savingAddress ||
                  !addressForm.firstName ||
                  !addressForm.lastName ||
                  !addressForm.street ||
                  !addressForm.city ||
                  !addressForm.postalCode ||
                  !addressForm.country
                }
                className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAddress ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {editingAddress ? "Modifier" : "Ajouter"}
              </button>
              <button
                onClick={closeAddressModal}
                className="px-6 py-3 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

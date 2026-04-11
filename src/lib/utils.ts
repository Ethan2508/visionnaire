export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    vue: "Lunettes de vue",
    soleil: "Lunettes de soleil",
    ski: "Masques de ski",
    sport: "Sport",
    enfant: "Enfant",
  };
  return labels[category] || category;
}

export function genderLabel(gender: string): string {
  const labels: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    mixte: "Mixte",
    enfant: "Enfant",
  };
  return labels[gender] || gender;
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    en_attente_paiement: "En attente de paiement",
    payee: "Payée",
    ordonnance_en_validation: "Ordonnance en validation",
    ordonnance_validee: "Ordonnance validée",
    ordonnance_refusee: "Ordonnance refusée",
    en_fabrication: "En fabrication",
    expediee: "Expédiée",
    prete_en_boutique: "Prête en boutique",
    livree: "Livrée",
    annulee: "Annulée",
  };
  return labels[status] || status;
}

export const ORDER_STATUS_STYLES: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" },
  payee: { label: "Payée", color: "bg-blue-100 text-blue-800" },
  ordonnance_en_validation: { label: "Ordonnance en validation", color: "bg-orange-100 text-orange-800" },
  ordonnance_validee: { label: "Ordonnance validée", color: "bg-emerald-100 text-emerald-800" },
  ordonnance_refusee: { label: "Ordonnance refusée", color: "bg-red-100 text-red-800" },
  en_fabrication: { label: "En fabrication", color: "bg-indigo-100 text-indigo-800" },
  expediee: { label: "Expédiée", color: "bg-purple-100 text-purple-800" },
  prete_en_boutique: { label: "Prête en boutique", color: "bg-teal-100 text-teal-800" },
  livree: { label: "Livrée", color: "bg-green-100 text-green-800" },
  annulee: { label: "Annulée", color: "bg-stone-100 text-stone-600" },
};

export const SHIPPING_COST = 6.90;
export const FREE_SHIPPING_THRESHOLD = 150;
